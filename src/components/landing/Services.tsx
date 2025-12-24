import { motion } from "framer-motion";
import { FileText, Receipt, Wallet, ArrowRight } from "lucide-react";

const services = [
  {
    icon: FileText,
    title: "Digital Forms & Data Collection",
    description: "Build custom mobile forms for inspections, audits, and checklists with offline capability.",
    features: [
      "Offline data capture",
      "Geo-tagging & image annotations",
      "Automated PDF/Excel reports",
      "iOS & Android apps"
    ],
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Receipt,
    title: "Invoicing & Billing",
    description: "Create estimates, invoices, and recurring bills with integrated payment processing.",
    features: [
      "Time & expense tracking",
      "Online payment acceptance",
      "Tax & discount handling",
      "Free for basic use"
    ],
    color: "from-primary to-blue-600"
  },
  {
    icon: Wallet,
    title: "Expense Management",
    description: "Scan receipts, auto-categorize with AI, and manage corporate spending effortlessly.",
    features: [
      "AI receipt scanning",
      "Virtual corporate cards",
      "Travel booking integration",
      "QuickBooks sync"
    ],
    color: "from-accent to-emerald-500"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function Services() {
  return (
    <section id="services" className="py-24 bg-background">
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
            Our Services
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Three Powerful Tools,{" "}
            <span className="text-gradient">One Platform</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Why choose one tool when you can have them all integrated? 
            Seamlessly connect your forms, invoices, and expenses.
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {services.map((service) => (
            <motion.div
              key={service.title}
              variants={itemVariants}
              className="group relative bg-card rounded-2xl p-8 shadow-card hover:shadow-glow transition-all duration-500 border border-border hover:border-primary/30"
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <service.icon className="w-7 h-7 text-primary-foreground" />
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {service.title}
              </h3>
              <p className="text-muted-foreground mb-6">
                {service.description}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Learn More Link */}
              <a
                href="#"
                className="inline-flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all"
              >
                Learn More
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
