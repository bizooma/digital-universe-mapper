import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Zap, Infinity, Lock, Clock, Shield, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCanonicalUrl } from "@/hooks/useCanonicalUrl";
import { usePageMeta } from "@/hooks/usePageMeta";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import lifetimeHeroBg from "@/assets/lifetime-hero-bg.png";

const features = [
  "Unlimited maps & nodes",
  "All export formats (PNG, SVG, PDF)",
  "Custom branding & logo upload",
  "No watermarks",
  "CSV bulk import",
  "Automated URL crawler",
  "Priority support",
  "All future Pro Plus updates",
];

const faqs = [
  {
    question: "What does 'lifetime' mean?",
    answer: "Pay once, use forever. No monthly fees, no annual renewals. Your access never expires as long as the service exists.",
  },
  {
    question: "What features are included?",
    answer: "You get full Pro Plus access including unlimited maps, all export formats, CSV import, URL crawler, custom branding, and all future updates to Pro Plus features.",
  },
  {
    question: "Is this a subscription?",
    answer: "No! This is a one-time payment of $59. You'll never be charged again for Pro Plus features.",
  },
  {
    question: "Can I upgrade from a current subscription?",
    answer: "Yes! If you have an active subscription, you can purchase lifetime access and then cancel your subscription through the customer portal.",
  },
  {
    question: "Is there a refund policy?",
    answer: "Due to the nature of digital products and the significant discount, lifetime deals are non-refundable. Please make sure this is right for you before purchasing.",
  },
];

export default function LifetimeDeal() {
  useCanonicalUrl();
  usePageMeta({
    title: "Lifetime Deal - Pro Plus Access",
    description: "Get lifetime Pro Plus access to Mapprr for a one-time payment of $59. Unlimited maps, all export formats, CSV import, URL crawler, and all future updates.",
  });
  const { session } = useAuth();
  const subscription = useSubscription();
  const isProPlus = subscription.isProPlus;
  const isLifetime = (subscription as any).isLifetime || false;
  const subscriptionLoading = subscription.loading;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const canceled = searchParams.get("canceled") === "true";
  const alreadyHasAccess = isProPlus || isLifetime;

  useEffect(() => {
    if (canceled) {
      toast.error("Purchase canceled. No charges were made.");
    }
  }, [canceled]);

  const handlePurchase = async () => {
    if (!session) {
      navigate("/signup?redirect=/lifetime");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-lifetime-checkout");
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Failed to start checkout. Please try again.");
      setIsLoading(false);
    }
  };

  // Auto-trigger checkout when redirected back from signup
  useEffect(() => {
    const autoCheckout = searchParams.get("checkout") === "true";
    if (autoCheckout && session && !subscriptionLoading && !alreadyHasAccess && !isLoading) {
      handlePurchase();
    }
  }, [session, subscriptionLoading, searchParams]);


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://mapprr.com" },
        { name: "Lifetime Deal", url: "https://mapprr.com/lifetime" },
      ]} />
      
      <main className="flex-1">
        <section className="relative py-16 md:py-24 px-4 overflow-hidden">
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${lifetimeHeroBg})` }}
          />
          <div className="absolute inset-0 bg-black/85" />
          <div className="container mx-auto max-w-4xl text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Limited Time Offer</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Lifetime Pro Plus Access
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Pay once, use forever. Get unlimited access to all Pro Plus features with a single payment. No subscriptions, no recurring fees.
              </p>

              <div className="flex items-center justify-center gap-4 mb-8">
                <span className="text-4xl md:text-5xl font-bold text-primary">$59</span>
                <div className="text-left">
                  <p className="text-sm text-muted-foreground line-through">$180/year</p>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Save 67%+</p>
                </div>
              </div>

              {subscriptionLoading ? (
                <Button disabled size="lg" className="min-w-[200px]">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </Button>
              ) : alreadyHasAccess ? (
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-full">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">
                      {isLifetime ? "You have lifetime access!" : "You already have Pro Plus access"}
                    </span>
                  </div>
                  <div>
                    <Button onClick={() => navigate("/dashboard")} variant="outline">
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handlePurchase}
                  disabled={isLoading}
                  size="lg"
                  className="min-w-[200px] text-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting checkout...
                    </>
                  ) : session ? (
                    <>
                      Get Lifetime Access
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Sign Up & Get Access
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
                Everything in Pro Plus, Forever
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                    className="flex items-center gap-3 p-4 bg-background rounded-lg border"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span>{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-12">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Infinity className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Lifetime Access</h3>
                  <p className="text-sm text-muted-foreground">No expiration, ever</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Lock className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Secure Payment</h3>
                  <p className="text-sm text-muted-foreground">Powered by Stripe · You'll see Bizooma, LLC on checkout</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">All Future Updates</h3>
                  <p className="text-sm text-muted-foreground">New features included</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{faq.question}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16">
          <div className="container mx-auto max-w-2xl px-4 text-center">
            <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Don't Miss This Deal
            </h2>
            <p className="text-muted-foreground mb-8">
              This special offer won't last forever. Lock in lifetime access today.
            </p>
            
            {!alreadyHasAccess && !subscriptionLoading && (
              <Button
                onClick={handlePurchase}
                disabled={isLoading}
                size="lg"
                className="min-w-[200px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting checkout...
                  </>
                ) : (
                  <>
                    Get Lifetime Access - $59
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
