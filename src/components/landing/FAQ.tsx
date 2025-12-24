import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is Aponda mobile-friendly?",
    answer: "Absolutely! Aponda is built mobile-first with native iOS and Android apps. All features work fully offline, and data syncs automatically when you're back online. Perfect for field teams working in remote areas."
  },
  {
    question: "How does the free tier work?",
    answer: "Our free tier is free forever—no credit card required. You get 5 custom forms, 50 invoices per month, and basic expense tracking. It's perfect for freelancers and small teams just getting started. Upgrade anytime as you grow."
  },
  {
    question: "Can I integrate with my existing accounting software?",
    answer: "Yes! Aponda integrates with 45+ tools including QuickBooks, Xero, FreshBooks, and more. Expenses, invoices, and payments sync automatically, eliminating double data entry."
  },
  {
    question: "How does AI expense categorization work?",
    answer: "Simply snap a photo of your receipt or forward it via email. Our AI extracts the merchant, amount, date, and category automatically with 95%+ accuracy. It learns your preferences over time for even smarter categorization."
  },
  {
    question: "Is my data secure?",
    answer: "Security is our top priority. We use bank-level 256-bit encryption, are SOC 2 Type II certified, and fully GDPR compliant. Your data is backed up across multiple secure data centers with 99.9% uptime guarantee."
  },
  {
    question: "What kind of support do you offer?",
    answer: "Free users get email support with 24-hour response times. Pro users enjoy priority support with live chat and phone support during business hours. Enterprise clients get a dedicated account manager and custom SLAs."
  }
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 bg-secondary/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Frequently Asked{" "}
            <span className="text-gradient">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about Aponda. Can't find an answer? Contact our support team.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-xl border border-border px-6 data-[state=open]:border-primary/30 data-[state=open]:shadow-soft transition-all"
              >
                <AccordionTrigger className="text-left text-foreground font-medium py-6 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
