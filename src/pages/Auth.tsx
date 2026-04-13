import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { useCreateCompany } from "@/hooks/useCompany";
import { getClientSafeError, logError } from "@/lib/errorHandler";
import apondaLogo from "@/assets/aponda-logo.png";

// Strong password validation with complexity requirements
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
  password: passwordSchema,
  fullName: z.string().trim().min(1, "Please enter your name").max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormMode = "login" | "signup";

const Auth = () => {
  const [mode, setMode] = useState<FormMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { signIn, signUp, user, isLoading } = useAuth();
  const createCompany = useCreateCompany();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user && !showOnboarding) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate, showOnboarding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      if (mode === "login") {
        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          return;
        }

        setIsSubmitting(true);
        const { error } = await signIn(email, password);

        if (error) {
          logError('Auth:signIn', error);
          toast.error(getClientSafeError(error));
        } else {
          toast.success("Welcome back!");
          navigate("/dashboard");
        }
      } else {
        const result = signupSchema.safeParse({ email, password, confirmPassword, fullName });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          return;
        }

        setIsSubmitting(true);
        const { error } = await signUp(email, password, fullName);

        if (error) {
          logError('Auth:signUp', error);
          toast.error(getClientSafeError(error));
        } else {
          toast.success("Account created successfully!");
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      logError('Auth:handleSubmit', error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnboardingComplete = (data: { businessName: string; businessType: string; teamSize: string; primaryUse: string[] }) => {
    console.log("Onboarding data:", data);
    // In a real app, save this to the database
    toast.success(`Welcome to Aponda, ${data.businessName}! Let's get started.`);
    setShowOnboarding(false);
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <OnboardingWizard 
        isOpen={showOnboarding} 
        onClose={() => {
          setShowOnboarding(false);
          navigate("/");
        }}
        onComplete={handleOnboardingComplete}
      />
      
      <div className="min-h-screen bg-background flex">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md text-center"
          >
            <img 
              src={apondaLogo} 
              alt="Aponda - Connecting Your World" 
              className="h-32 w-auto mx-auto mb-8"
            />
            <h1 className="text-4xl font-bold text-primary-foreground mb-4">
              Welcome to Aponda
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Automate your business with our all-in-one platform for forms, invoicing, and expense management.
            </p>
          </motion.div>
        </div>

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="mb-8"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            <div className="lg:hidden flex items-center gap-2 mb-8">
              <img 
                src={apondaLogo} 
                alt="Aponda" 
                className="h-10 w-auto"
              />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              {mode === "login" ? "Sign in to your account" : "Create your account"}
            </h2>
            <p className="text-muted-foreground mb-8">
              {mode === "login"
                ? "Enter your credentials to access your dashboard"
                : "Start your free trial today"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className={errors.fullName ? "border-destructive" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={errors.confirmPassword ? "border-destructive" : ""}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Please wait..."
                  : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
              </Button>
            </form>

            {mode === "login" && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                <button
                  onClick={() => navigate("/forgot-password")}
                  className="text-primary hover:underline font-medium"
                >
                  Forgot your password?
                </button>
              </p>
            )}

            <p className="text-center text-sm text-muted-foreground mt-4">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => {
                      setMode("signup");
                      setErrors({});
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      setMode("login");
                      setErrors({});
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Auth;
