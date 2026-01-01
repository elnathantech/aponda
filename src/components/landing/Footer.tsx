import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Twitter, Linkedin, Github, Mail } from "lucide-react";
import apondaLogo from "@/assets/aponda-logo.png";

const footerLinks = {
  Product: ["Features", "Pricing", "Integrations", "Mobile Apps", "API Docs"],
  Company: ["About Us", "Careers", "Blog", "Press Kit", "Contact"],
  Resources: ["Help Center", "Guides", "Webinars", "Community", "Status"],
  Legal: ["Privacy Policy", "Terms of Service", "Security", "GDPR", "Cookies"]
};

export function Footer() {
  return (
    <footer className="bg-gradient-hero text-primary-foreground">
      {/* Newsletter Section */}
      <div className="border-b border-primary-foreground/10">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Stop juggling apps. Focus on growth.
            </h3>
            <p className="text-primary-foreground/70 mb-8">
              Join 100,000+ businesses automating their operations with Aponda. 
              Get weekly tips and product updates.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:border-primary-foreground/40"
              />
              <Button variant="accent" size="lg" className="whitespace-nowrap">
                Subscribe
                <Mail className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Logo & Description */}
          <div className="col-span-2">
            <a href="#" className="flex items-center gap-2 mb-4">
              <img 
                src={apondaLogo} 
                alt="Aponda - Connecting Your World" 
                className="h-12 w-auto"
              />
            </a>
            <p className="text-primary-foreground/60 mb-6 max-w-xs">
              The all-in-one platform for forms, invoices, and expenses. 
              Automate your business and save 40+ hours per month.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4">
              {[Twitter, Linkedin, Github].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/60">
            © 2024 Aponda. All rights reserved.
          </p>
          <p className="text-sm text-primary-foreground/60">
            Made with ❤️ for businesses worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
