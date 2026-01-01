import { motion } from "framer-motion";

const integrations = [
  {
    name: "QuickBooks",
    logo: "https://cdn.worldvectorlogo.com/logos/quickbooks-2.svg",
    category: "Accounting"
  },
  {
    name: "Xero",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/cd/Xero_software_logo.svg",
    category: "Accounting"
  },
  {
    name: "Stripe",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg",
    category: "Payments"
  },
  {
    name: "PayPal",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg",
    category: "Payments"
  },
  {
    name: "Slack",
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
    category: "Collaboration"
  },
  {
    name: "Google Drive",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg",
    category: "Storage"
  },
  {
    name: "Dropbox",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c2/Dropbox_logo_2017.svg",
    category: "Storage"
  },
  {
    name: "Shopify",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg",
    category: "E-commerce"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
};

export function Integrations() {
  return (
    <section id="integrations" className="py-24 bg-secondary/50">
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
            Integrations
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Connect Your{" "}
            <span className="text-gradient">Favorite Tools</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Seamlessly integrate with 45+ business tools your SME already uses. 
            No coding required—sync in minutes, not days.
          </p>
        </motion.div>

        {/* Integration Logos Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 max-w-5xl mx-auto mb-12"
        >
          {integrations.map((integration) => (
            <motion.div
              key={integration.name}
              variants={itemVariants}
              className="group relative bg-card rounded-xl p-6 shadow-card border border-border hover:border-primary/30 hover:shadow-glow transition-all duration-300 flex flex-col items-center justify-center aspect-square"
            >
              <img
                src={integration.logo}
                alt={`${integration.name} integration`}
                className="w-12 h-12 object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
              />
              <span className="mt-3 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                {integration.name}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-4">
            Don&apos;t see your tool? We add new integrations every week.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            Request an integration →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
