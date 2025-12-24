import { motion } from "framer-motion";
import { 
  Wifi, 
  ScanLine, 
  RefreshCw, 
  Plane, 
  FileBarChart, 
  Puzzle,
  Shield,
  Zap
} from "lucide-react";

const features = [
  {
    icon: Wifi,
    title: "Offline Mode",
    description: "Work anywhere without internet. Data syncs automatically when connected.",
    stat: "100% uptime"
  },
  {
    icon: ScanLine,
    title: "AI Receipt Scanning",
    description: "Snap a photo—AI extracts and categorizes expense data instantly.",
    stat: "90% faster"
  },
  {
    icon: RefreshCw,
    title: "Recurring Billing",
    description: "Set up automatic invoices for subscription-based services.",
    stat: "Zero manual work"
  },
  {
    icon: Plane,
    title: "Travel Booking",
    description: "Book flights and hotels directly. Expenses auto-captured.",
    stat: "Cashback rewards"
  },
  {
    icon: FileBarChart,
    title: "Custom Reports",
    description: "Generate PDF/Excel reports with your branding in seconds.",
    stat: "1-click export"
  },
  {
    icon: Puzzle,
    title: "45+ Integrations",
    description: "Connect with QuickBooks, Xero, Uber, and more.",
    stat: "Seamless sync"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption and compliance with GDPR & SOC 2.",
    stat: "99.9% uptime"
  },
  {
    icon: Zap,
    title: "Smart Automation",
    description: "AI-powered policy checks and approval workflows.",
    stat: "90% fewer errors"
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-background">
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
            Features
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Everything You Need to{" "}
            <span className="text-gradient">Scale Effortlessly</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed to save you time, reduce errors, and grow your business.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group relative bg-card rounded-xl p-6 shadow-card hover:shadow-glow transition-all duration-500 border border-border hover:border-primary/30 overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Content */}
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {feature.description}
                </p>
                <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                  {feature.stat}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
