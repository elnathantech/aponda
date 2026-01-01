import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  Users,
  FileText,
  CreditCard,
  Receipt,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  X,
} from "lucide-react";

interface OnboardingData {
  businessName: string;
  businessType: string;
  teamSize: string;
  primaryUse: string[];
}

const businessTypes = [
  { value: "retail", label: "Retail & E-commerce", icon: Building2 },
  { value: "services", label: "Professional Services", icon: Users },
  { value: "hospitality", label: "Hospitality & Food", icon: Receipt },
  { value: "healthcare", label: "Healthcare", icon: FileText },
  { value: "other", label: "Other", icon: Building2 },
];

const teamSizes = [
  { value: "1", label: "Just me" },
  { value: "2-10", label: "2-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "50+", label: "50+ employees" },
];

const primaryUses = [
  { value: "invoicing", label: "Invoicing & Billing", icon: CreditCard },
  { value: "expenses", label: "Expense Tracking", icon: Receipt },
  { value: "forms", label: "Custom Forms", icon: FileText },
  { value: "reports", label: "Financial Reports", icon: FileText },
];

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: OnboardingData) => void;
}

export function OnboardingWizard({ isOpen, onClose, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    businessName: "",
    businessType: "",
    teamSize: "",
    primaryUse: [],
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.businessName.trim().length > 0;
      case 2:
        return data.businessType !== "";
      case 3:
        return data.teamSize !== "";
      case 4:
        return data.primaryUse.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const togglePrimaryUse = (value: string) => {
    setData((prev) => ({
      ...prev,
      primaryUse: prev.primaryUse.includes(value)
        ? prev.primaryUse.filter((u) => u !== value)
        : [...prev.primaryUse, value],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg mx-4 bg-card rounded-2xl shadow-xl border border-border overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Setup Wizard</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Welcome to Aponda</h2>
          <p className="text-muted-foreground mt-1">
            Let's personalize your experience in just a few steps.
          </p>
        </div>

        {/* Progress */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        <div className="p-6 pt-2 min-h-[280px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    What's your business name?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This will appear on your invoices and forms.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    placeholder="e.g., Acme Corp"
                    value={data.businessName}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, businessName: e.target.value }))
                    }
                    className="text-lg"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    What type of business do you run?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    We'll customize templates and features for your industry.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {businessTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setData((prev) => ({ ...prev, businessType: type.value }))}
                      className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                        data.businessType === type.value
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <type.icon className="w-5 h-5" />
                      <span className="font-medium">{type.label}</span>
                      {data.businessType === type.value && (
                        <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    How big is your team?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    We'll recommend the right plan for your needs.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {teamSizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setData((prev) => ({ ...prev, teamSize: size.value }))}
                      className={`p-4 rounded-lg border text-center transition-all ${
                        data.teamSize === size.value
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="font-medium">{size.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    What will you use Aponda for?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Select all that apply. We'll prioritize these features.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {primaryUses.map((use) => (
                    <button
                      key={use.value}
                      onClick={() => togglePrimaryUse(use.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                        data.primaryUse.includes(use.value)
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <use.icon className="w-6 h-6" />
                      <span className="font-medium text-sm text-center">{use.label}</span>
                      {data.primaryUse.includes(use.value) && (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            variant="hero"
            onClick={handleNext}
            disabled={!canProceed()}
            className="gap-2"
          >
            {step === totalSteps ? "Get Started" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
