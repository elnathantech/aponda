import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey) return new Response("Stripe not configured", { status: 500 });

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    if (webhookSecret && sig) {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (e) {
    console.error("Webhook signature verification failed", e);
    return new Response("Invalid signature", { status: 400 });
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = session.metadata?.invoice_id;
    if (invoiceId) {
      const amount = (session.amount_total ?? 0) / 100;

      await admin.from("invoice_payment_links")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("external_id", session.id);

      const { data: inv } = await admin.from("invoices").select("total, amount_paid").eq("id", invoiceId).maybeSingle();
      if (inv) {
        const newPaid = Number(inv.amount_paid || 0) + amount;
        const isPaid = newPaid >= Number(inv.total) - 0.01;
        await admin.from("invoices").update({
          amount_paid: newPaid,
          status: isPaid ? "paid" : "sent",
          paid_at: isPaid ? new Date().toISOString() : null,
        }).eq("id", invoiceId);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
