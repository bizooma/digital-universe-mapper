import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Loader2, CheckCircle, XCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error" | "login-required">("loading");
  const [message, setMessage] = useState("");
  const [teamName, setTeamName] = useState("");

  useEffect(() => {
    const acceptInvitation = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid invitation link");
        return;
      }

      if (authLoading) return;

      if (!user) {
        setStatus("login-required");
        setMessage("Please log in to accept your team invitation");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("accept-team-invite", {
          body: { token },
        });

        if (error) throw error;

        if (data.error) {
          setStatus("error");
          setMessage(data.error);
        } else {
          setStatus("success");
          setTeamName(data.teamName);
          setMessage(data.message);
          toast.success(data.message);
        }
      } catch (err) {
        console.error("Error accepting invitation:", err);
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Failed to accept invitation");
      }
    };

    acceptInvitation();
  }, [token, user, authLoading]);

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Processing your invitation...</p>
          </div>
        );

      case "login-required":
        return (
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Login Required</h2>
              <p className="text-muted-foreground max-w-md">{message}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link to={`/signup?redirect=/accept-invite?token=${token}`}>Create Account</Link>
              </Button>
              <Button variant="hero" asChild>
                <Link to={`/login?redirect=/accept-invite?token=${token}`}>Log In</Link>
              </Button>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center gap-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center"
            >
              <CheckCircle className="h-8 w-8 text-green-500" />
            </motion.div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to {teamName}!</h2>
              <p className="text-muted-foreground max-w-md">
                You're now a member of the team. Start collaborating on maps with your teammates.
              </p>
            </div>
            <Button variant="hero" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Invitation Failed</h2>
              <p className="text-muted-foreground max-w-md">{message}</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              Go to Homepage
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Users className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Team Invitation</span>
          </div>
          {renderContent()}
        </div>
      </motion.div>
    </div>
  );
}
