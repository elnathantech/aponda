import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Field Operations Manager",
    company: "BuildRight Construction",
    quote: "Aponda saved us 20+ hours per week on invoicing alone. The form-to-invoice automation is a game-changer for our field teams.",
    rating: 5
  },
  {
    name: "Marcus Thompson",
    role: "Finance Director",
    company: "TechStart Inc.",
    quote: "We replaced 4 different tools with Aponda. The expense tracking with AI categorization has reduced our processing time by 90%.",
    rating: 5
  },
  {
    name: "Elena Rodriguez",
    role: "Freelance Consultant",
    company: "Self-employed",
    quote: "As a freelancer, I love the free tier. Professional invoices, expense tracking, and client forms—all in one place. Highly recommend!",
    rating: 5
  }
];

const stats = [
  { value: "15M+", label: "Expenses Processed" },
  { value: "250K+", label: "Invoices Sent" },
  { value: "99.9%", label: "Uptime Guaranteed" },
  { value: "2x", label: "Faster Payments" }
];

const integrations = [
  "QuickBooks", "Xero", "Uber", "Slack", "Google Drive", "Dropbox"
];

export function SocialProof() {
  return (
    <section className="py-24 bg-secondary/50">
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
            Testimonials
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Loved by{" "}
            <span className="text-gradient">100,000+ Businesses</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            See why teams worldwide trust Aponda to streamline their operations.
          </p>
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card rounded-2xl p-8 shadow-card border border-border relative"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/10" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-hero rounded-3xl p-12 mb-20"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                  {stat.value}
                </div>
                <div className="text-primary-foreground/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Integrations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-6">Integrates with your favorite tools</p>
          <div className="flex flex-wrap justify-center gap-6">
            {integrations.map((integration) => (
              <div
                key={integration}
                className="px-6 py-3 bg-card rounded-lg border border-border text-foreground font-medium hover:border-primary/30 transition-colors"
              >
                {integration}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
