import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.4/cors";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const results: Record<string, unknown> = {};

    // 1. Auto-flag overdue invoices
    const { data: overdueInvoices, error: overdueErr } = await supabase
      .from("invoices")
      .update({ status: "overdue" })
      .eq("status", "sent")
      .lt("due_date", new Date().toISOString().split("T")[0])
      .select("id, company_id, invoice_number, client_name, total");

    if (overdueErr) throw overdueErr;
    results.overdue_flagged = overdueInvoices?.length || 0;

    // Log overdue flagging
    if (overdueInvoices && overdueInvoices.length > 0) {
      const logs = overdueInvoices.map((inv) => ({
        company_id: inv.company_id,
        automation_type: "overdue_flagging",
        status: "success",
        details: {
          invoice_number: inv.invoice_number,
          client_name: inv.client_name,
          total: inv.total,
        },
        related_id: inv.id,
      }));
      await supabase.from("automation_logs").insert(logs);
    }

    // 2. Generate recurring invoices
    const today = new Date().toISOString().split("T")[0];
    const { data: dueRecurring, error: recurringErr } = await supabase
      .from("recurring_invoices")
      .select("*")
      .eq("is_active", true)
      .lte("next_run_date", today);

    if (recurringErr) throw recurringErr;

    let recurringGenerated = 0;

    for (const template of dueRecurring || []) {
      // Get current invoice count for numbering
      const { count } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("company_id", template.company_id);

      const invoiceNumber = `INV-${String((count || 0) + 1).padStart(4, "0")}`;
      const items = (template.items_template as Array<{ description: string; quantity: number; unit_price: number }>) || [];
      const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
      const taxRate = template.tax_rate ?? 20;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + template.payment_due_days);

      // Create invoice
      const { data: invoice, error: invErr } = await supabase
        .from("invoices")
        .insert({
          company_id: template.company_id,
          project_id: template.project_id,
          invoice_number: invoiceNumber,
          client_name: template.client_name,
          client_email: template.client_email,
          client_address: template.client_address,
          status: "sent",
          due_date: dueDate.toISOString().split("T")[0],
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total,
          notes: template.notes,
          payment_terms: template.payment_terms,
        })
        .select()
        .single();

      if (invErr) {
        console.error("Failed to create recurring invoice:", invErr);
        await supabase.from("automation_logs").insert({
          company_id: template.company_id,
          automation_type: "recurring_invoice",
          status: "error",
          details: { error: invErr.message, template_id: template.id },
          related_id: template.id,
        });
        continue;
      }

      // Create invoice items
      if (items.length > 0 && invoice) {
        const invoiceItems = items.map((item) => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price,
        }));
        await supabase.from("invoice_items").insert(invoiceItems);
      }

      // Calculate next run date
      const nextDate = new Date(template.next_run_date);
      switch (template.frequency) {
        case "weekly": nextDate.setDate(nextDate.getDate() + 7); break;
        case "fortnightly": nextDate.setDate(nextDate.getDate() + 14); break;
        case "monthly": nextDate.setMonth(nextDate.getMonth() + 1); break;
        case "quarterly": nextDate.setMonth(nextDate.getMonth() + 3); break;
        case "yearly": nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      }

      await supabase
        .from("recurring_invoices")
        .update({
          next_run_date: nextDate.toISOString().split("T")[0],
          last_generated_at: new Date().toISOString(),
          total_generated: template.total_generated + 1,
        })
        .eq("id", template.id);

      // Log success
      await supabase.from("automation_logs").insert({
        company_id: template.company_id,
        automation_type: "recurring_invoice",
        status: "success",
        details: {
          invoice_number: invoiceNumber,
          client_name: template.client_name,
          total,
          template_id: template.id,
        },
        related_id: invoice?.id,
      });

      recurringGenerated++;
    }

    results.recurring_generated = recurringGenerated;

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Financial automation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
