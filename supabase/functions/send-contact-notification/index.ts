import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactNotificationRequest {
  name: string;
  email: string;
  subject?: string;
  message: string;
  adminEmail: string;
}

// In-memory rate limiting store (resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5;

function checkRateLimit(email: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(email);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(email, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count };
}

// Server-side validation matching database constraints
function validateInput(data: ContactNotificationRequest): { valid: boolean; error?: string } {
  // Name validation
  if (!data.name || data.name.trim().length === 0) {
    return { valid: false, error: "Name is required" };
  }
  if (data.name.length > 100) {
    return { valid: false, error: "Name must be less than 100 characters" };
  }

  // Email validation
  if (!data.email || data.email.trim().length === 0) {
    return { valid: false, error: "Email is required" };
  }
  if (data.email.length > 255) {
    return { valid: false, error: "Email must be less than 255 characters" };
  }
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(data.email)) {
    return { valid: false, error: "Invalid email format" };
  }

  // Subject validation (optional)
  if (data.subject && data.subject.length > 200) {
    return { valid: false, error: "Subject must be less than 200 characters" };
  }

  // Message validation
  if (!data.message || data.message.trim().length === 0) {
    return { valid: false, error: "Message is required" };
  }
  if (data.message.length > 2000) {
    return { valid: false, error: "Message must be less than 2000 characters" };
  }

  // Admin email validation
  if (!data.adminEmail || !emailRegex.test(data.adminEmail)) {
    return { valid: false, error: "Invalid admin email" };
  }

  return { valid: true };
}

// HTML escape to prevent XSS in email content
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

// Verify that this request came after a successful database insert
async function verifyDatabaseSubmission(email: string, message: string): Promise<boolean> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Check if there's a recent submission with matching email and message
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('id, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error || !data || data.length === 0) {
      console.log("No matching database submission found for:", email);
      return false;
    }
    
    // Verify the submission is recent (within last 5 minutes)
    const submissionTime = new Date(data[0].created_at).getTime();
    const now = Date.now();
    const fiveMinutesMs = 5 * 60 * 1000;
    
    if (now - submissionTime > fiveMinutesMs) {
      console.log("Submission too old, rejecting:", email);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Error verifying database submission:", err);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: ContactNotificationRequest = await req.json();

    // Server-side validation
    const validation = validateInput(requestData);
    if (!validation.valid) {
      console.log("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { name, email, subject, message, adminEmail } = requestData;

    // Rate limiting check
    const rateLimit = checkRateLimit(email.toLowerCase());
    if (!rateLimit.allowed) {
      console.log("Rate limit exceeded for:", email);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: { 
            "Content-Type": "application/json", 
            "X-RateLimit-Remaining": "0",
            ...corsHeaders 
          },
        }
      );
    }

    // Verify this request corresponds to a valid database submission
    const isValidSubmission = await verifyDatabaseSubmission(email, message);
    if (!isValidSubmission) {
      console.log("Invalid submission - no matching database record:", email);
      return new Response(
        JSON.stringify({ error: "Invalid request. Please submit via the contact form." }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Sanitize inputs for email HTML content
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject || "No Subject");
    const safeMessage = escapeHtml(message);

    console.log("Sending contact notification email", { name: safeName, email: safeEmail, subject: safeSubject, adminEmail });

    // Send notification to admin
    const adminEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Aponda <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `New Contact Form Submission: ${safeSubject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #007BFF;">New Contact Form Submission</h1>
            <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>From:</strong> ${safeName}</p>
              <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
              <p><strong>Subject:</strong> ${safeSubject}</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap;">${safeMessage}</p>
            </div>
            <p style="color: #666; font-size: 12px;">
              This message was sent via the Aponda contact form.
            </p>
          </div>
        `,
      }),
    });

    const adminResult = await adminEmailResponse.json();
    console.log("Admin notification sent:", adminResult);

    // Send confirmation to the user
    const userEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Aponda <onboarding@resend.dev>",
        to: [email],
        subject: "We received your message!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #007BFF;">Thank you for contacting us, ${safeName}!</h1>
            <p>We have received your message and will get back to you as soon as possible.</p>
            <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Your message:</strong></p>
              <p style="white-space: pre-wrap;">${safeMessage}</p>
            </div>
            <p>Best regards,<br>The Aponda Team</p>
          </div>
        `,
      }),
    });

    const userResult = await userEmailResponse.json();
    console.log("User confirmation sent:", userResult);

    return new Response(
      JSON.stringify({ success: true, adminEmail: adminResult, userEmail: userResult }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json", 
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          ...corsHeaders 
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-notification function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
