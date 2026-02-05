import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useCanonicalUrl } from "@/hooks/useCanonicalUrl";
import { usePageMeta } from "@/hooks/usePageMeta";
import { toast } from "sonner";

export default function Signup() {
  useCanonicalUrl();
  usePageMeta({
    title: "Sign Up",
    description: "Create your free Mapprr account and start building beautiful visual site maps in minutes. No credit card required."
  });
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signUp(email, password, name);

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    toast.success("Account created! Taking you to your dashboard...");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Visual */}
      <div className="hidden lg:flex flex-1 bg-card relative overflow-hidden">
        <div className="absolute inset-0 canvas-dots opacity-30" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex items-center justify-center w-full p-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Start mapping your digital universe
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Create beautiful, interactive maps of your entire online presence in minutes.
            </p>
            
            {/* Feature List */}
            <div className="mt-8 space-y-4 text-left max-w-xs mx-auto">
              {[
                "Free forever plan available",
                "No credit card required",
                "Create your first map in minutes",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary rounded-lg blur-md opacity-50" />
              <div className="relative bg-gradient-primary p-2 rounded-lg">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <span className="text-xl font-bold text-foreground">LinkScape</span>
          </Link>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Create your account
          </h1>
          <p className="text-muted-foreground mb-8">
            Get started with your free account
          </p>

          {/* Google Sign Up */}
          <Button
            variant="outline"
            className="w-full mb-6 h-12"
            type="button"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create account"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            By signing up, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
