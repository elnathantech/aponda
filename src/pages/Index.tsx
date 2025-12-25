import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Services } from "@/components/landing/Services";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { SocialProof } from "@/components/landing/SocialProof";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import ContactForm from "@/components/landing/ContactForm";
import { Footer } from "@/components/landing/Footer";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Aponda - All-in-One Business Forms, Invoicing & Expense Management</title>
        <meta 
          name="description" 
          content="Automate your business with Aponda. Combine digital forms, invoicing, and AI expense tracking in one platform. Go paperless, get paid 2x faster. Free to start." 
        />
        <meta name="keywords" content="all-in-one business forms, free invoicing software, AI expense tracker, mobile data collection, expense management" />
        <link rel="canonical" href="https://aponda.com" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <Hero />
          <Services />
          <HowItWorks />
          <Features />
          <SocialProof />
          <Pricing />
          <FAQ />
          <ContactForm />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
