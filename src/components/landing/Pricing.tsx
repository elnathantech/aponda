import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";

const plans = [
  {
    name: "Free",
    description: "Perfect for freelancers and startups getting started.",
    price: "$0",
    period: "forever",
    features: [
      "5 custom forms",
      "50 invoices/month",
      "Basic expense tracking",
      "Mobile apps (iOS & Android)",
      "Email support"
    ],
    cta: "Start Free",
    popular: false
  },
  {
    name: "Pro",
    description: "For growing teams that need full integration power.",
    price: "$9",
    period: "/user/month",
    features: [
      "Unlimited forms & invoices",
      "AI expense categorization",
      "Recurring billing",
      "45+ integrations",
      "Custom reports & branding",
      "Priority support",
      "Virtual corporate cards"
    ],
    cta: "Start Free Trial",
    popular: true
  },
  {
    name: "Enterprise",
    description: "Custom solutions for large organizations.",
    price: "Custom",
    period: "",
    features: [
      "Everything in Pro",
      "Unlimited users",
      "Advanced workflows",
      "Dedicated account manager",
      "Custom integrations",
      "SLA & compliance",
      "On-premise option"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Simple, Transparent{" "}
            <span className="text-gradient">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No credit card required. Start free and scale as you grow.
            Corporate card cashback offsets your subscription cost.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative bg-card rounded-2xl p-8 shadow-card border ${
                plan.popular 
                  ? "border-primary shadow-glow scale-105" 
                  : "border-border"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-gradient-primary text-primary-foreground text-sm font-medium">
                    <Zap className="w-4 h-4" />
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {plan.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              {/* CTA */}
              <Button 
                variant={plan.popular ? "hero" : "outline"} 
                className="w-full mb-8"
                size="lg"
              >
                {plan.cta}
              </Button>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
