import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.4/cors";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    // Find invoices due within 3 days or already overdue with client email
    const { data: remindableInvoices, error } = await supabase
      .from("invoices")
      .select("*, companies:company_id(name)")
      .in("status", ["sent", "overdue"])
      .not("client_email", "is", null)
      .lte("due_date", threeDaysFromNow.toISOString().split("T")[0]);

    if (error) throw error;

    let sent = 0;
    let failed = 0;

    for (const inv of remindableInvoices || []) {
      if (!inv.client_email || !resendApiKey) continue;

      const isOverdue = new Date(inv.due_date) < today;
      const companyName = (inv.companies as any)?.name || "Our company";
      const subject = isOverdue
        ? `Overdue Invoice ${inv.invoice_number} — Payment Required`
        : `Payment Reminder: Invoice ${inv.invoice_number} Due Soon`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${isOverdue ? '#dc2626' : '#007BFF'};">${subject}</h2>
          <p>Dear ${inv.client_name},</p>
          <p>${isOverdue
            ? `This is a reminder that invoice <strong>${inv.invoice_number}</strong> was due on <strong>${new Date(inv.due_date).toLocaleDateString("en-GB")}</strong> and remains unpaid.`
            : `This is a friendly reminder that invoice <strong>${inv.invoice_number}</strong> is due on <strong>${new Date(inv.due_date).toLocaleDateString("en-GB")}</strong>.`
          }</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f3f4f6;"><td style="padding: 10px; font-weight: bold;">Invoice Total</td><td style="padding: 10px; text-align: right;">£${inv.total.toFixed(2)}</td></tr>
            <tr><td style="padding: 10px; font-weight: bold;">Amount Paid</td><td style="padding: 10px; text-align: right;">£${inv.amount_paid.toFixed(2)}</td></tr>
            <tr style="background: #f3f4f6;"><td style="padding: 10px; font-weight: bold;">Balance Due</td><td style="padding: 10px; text-align: right; font-weight: bold; color: #dc2626;">£${(inv.total - inv.amount_paid).toFixed(2)}</td></tr>
          </table>
          <p>Please arrange payment at your earliest convenience.</p>
          <p>Kind regards,<br/>${companyName}</p>
        </div>
      `;

      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Aponda <onboarding@resend.dev>",
            to: [inv.client_email],
            subject,
            html,
          }),
        });

        if (emailRes.ok) {
          sent++;
          await supabase.from("automation_logs").insert({
            company_id: inv.company_id,
            automation_type: "payment_reminder",
            status: "success",
            details: {
              invoice_number: inv.invoice_number,
              client_email: inv.client_email,
              is_overdue: isOverdue,
            },
            related_id: inv.id,
          });
        } else {
          failed++;
          const errBody = await emailRes.text();
          await supabase.from("automation_logs").insert({
            company_id: inv.company_id,
            automation_type: "payment_reminder",
            status: "error",
            details: { error: errBody, invoice_number: inv.invoice_number },
            related_id: inv.id,
          });
        }
      } catch (emailErr) {
        failed++;
        console.error("Email send error:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, reminders_sent: sent, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Payment reminder error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
