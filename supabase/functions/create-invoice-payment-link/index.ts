import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { invoice_id } = await req.json();
    if (!invoice_id) return new Response(JSON.stringify({ error: "invoice_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Fetch invoice via RLS-scoped client to enforce ownership
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select("*, companies!inner(name, user_id)")
      .eq("id", invoice_id)
      .maybeSingle();
    if (invErr || !invoice) return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return new Response(JSON.stringify({ error: "Stripe not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });

    const amountDue = Math.max(0, Number(invoice.total) - Number(invoice.amount_paid || 0));
    if (amountDue <= 0) return new Response(JSON.stringify({ error: "Invoice already paid" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const origin = req.headers.get("origin") || "https://aponda.lovable.app";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: invoice.client_email || undefined,
      line_items: [{
        price_data: {
          currency: "gbp",
          product_data: { name: `Invoice ${invoice.invoice_number}`, description: `${invoice.companies.name} → ${invoice.client_name}` },
          unit_amount: Math.round(amountDue * 100),
        },
        quantity: 1,
      }],
      metadata: { invoice_id: invoice.id, company_id: invoice.company_id },
      success_url: `${origin}/pay/success?invoice=${invoice.invoice_number}`,
      cancel_url: `${origin}/pay/cancelled?invoice=${invoice.invoice_number}`,
    });

    const { data: link, error: linkErr } = await admin.from("invoice_payment_links").insert({
      invoice_id: invoice.id,
      company_id: invoice.company_id,
      provider: "stripe",
      external_id: session.id,
      checkout_url: session.url,
      amount: amountDue,
      currency: "gbp",
      status: "open",
    }).select().single();
    if (linkErr) throw linkErr;

    return new Response(JSON.stringify({ url: session.url, link_id: link.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-invoice-payment-link error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
