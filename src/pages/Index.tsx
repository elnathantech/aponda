import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Services } from "@/components/landing/Services";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Integrations } from "@/components/landing/Integrations";
import { SocialProof } from "@/components/landing/SocialProof";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import ContactForm from "@/components/landing/ContactForm";
import { Footer } from "@/components/landing/Footer";
import { AIAssistant } from "@/components/landing/AIAssistant";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Aponda - AI-Powered Business Tools for SMEs | Forms, Invoicing & Expenses</title>
        <meta 
          name="description" 
          content="AI-powered business automation for small & medium enterprises. Combine digital forms, invoicing, and expense tracking. Save 40+ hours monthly. Get paid 2x faster. Free to start." 
        />
        <meta name="keywords" content="SME business tools, AI invoicing, expense management software, small business automation, QuickBooks alternative" />
        <link rel="canonical" href="https://aponda.com" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <Hero />
          <Services />
          <HowItWorks />
          <Features />
          <Integrations />
          <SocialProof />
          <Pricing />
          <FAQ />
          <ContactForm />
        </main>
        <Footer />
        <AIAssistant />
      </div>
    </>
  );
};

export default Index;
