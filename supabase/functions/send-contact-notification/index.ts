import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message, adminEmail }: ContactNotificationRequest = await req.json();

    console.log("Sending contact notification email", { name, email, subject, adminEmail });

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
        subject: `New Contact Form Submission: ${subject || "No Subject"}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #007BFF;">New Contact Form Submission</h1>
            <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>From:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>Subject:</strong> ${subject || "No Subject"}</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap;">${message}</p>
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
            <h1 style="color: #007BFF;">Thank you for contacting us, ${name}!</h1>
            <p>We have received your message and will get back to you as soon as possible.</p>
            <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Your message:</strong></p>
              <p style="white-space: pre-wrap;">${message}</p>
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
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
