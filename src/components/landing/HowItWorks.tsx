import { motion } from "framer-motion";
import { Smartphone, FileOutput, CreditCard, BarChart3 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Smartphone,
    title: "Build & Collect",
    description: "Create custom forms and track expenses on mobile—even offline. Capture data anywhere, anytime."
  },
  {
    number: "02",
    icon: FileOutput,
    title: "Auto-Generate",
    description: "Form data automatically populates invoices. No manual entry, no errors, no hassle."
  },
  {
    number: "03",
    icon: CreditCard,
    title: "Pay & Reimburse",
    description: "Accept payments instantly and process reimbursements with one click."
  },
  {
    number: "04",
    icon: BarChart3,
    title: "Analyze & Grow",
    description: "View real-time reports and insights in your dashboard. Make data-driven decisions."
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-secondary/50">
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
            Simple Setup
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Up and Running{" "}
            <span className="text-gradient">in Minutes</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No IT department needed. Our AI guides you through setup—most SMEs are live in under 10 minutes.
          </p>
        </motion.div>

        {/* Steps Timeline */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connection Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-accent to-primary hidden lg:block" />

          <div className="space-y-12 lg:space-y-0">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex flex-col lg:flex-row items-center gap-8 ${
                  index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                }`}
              >
                {/* Content */}
                <div className={`flex-1 ${index % 2 === 0 ? "lg:text-right" : "lg:text-left"}`}>
                  <div className={`bg-card p-8 rounded-2xl shadow-card border border-border hover:border-primary/30 transition-colors ${
                    index % 2 === 0 ? "lg:mr-8" : "lg:ml-8"
                  }`}>
                    <span className="text-sm font-bold text-primary mb-2 block">
                      Step {step.number}
                    </span>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Icon Node */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                    <step.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                </div>

                {/* Empty space for alternating layout */}
                <div className="flex-1 hidden lg:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
