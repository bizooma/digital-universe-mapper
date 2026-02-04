import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useState } from "react";

const plans = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Perfect for getting started",
    features: [
      "1 map",
      "Up to 10 nodes per map",
      "PNG export",
      "Basic support",
      "LinkScape watermark",
    ],
    notIncluded: [
      "Custom shareable URL",
      "PDF export",
      "Priority support",
    ],
    cta: "Get Started Free",
    ctaVariant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    monthlyPrice: 8,
    yearlyPrice: 72,
    description: "For serious creators",
    features: [
      "Unlimited maps",
      "Unlimited nodes",
      "PNG & PDF export",
      "No watermark",
      "Custom shareable URL",
      "Priority support",
      "Custom themes",
      "Analytics dashboard",
    ],
    notIncluded: [],
    cta: "Start Free Trial",
    ctaVariant: "hero" as const,
    popular: true,
  },
  {
    name: "Team",
    monthlyPrice: 20,
    yearlyPrice: 192,
    description: "For teams and agencies",
    features: [
      "Everything in Pro",
      "Up to 5 team members",
      "Shared workspace",
      "Team collaboration",
      "Admin controls",
      "SSO integration",
      "API access",
      "Dedicated support",
    ],
    notIncluded: [],
    cta: "Contact Sales",
    ctaVariant: "outline" as const,
    popular: false,
  },
];

const faqs = [
  {
    question: "How does the free trial work?",
    answer: "Start with a 14-day free trial of Pro features. No credit card required. After the trial, you can continue with the Free plan or upgrade to Pro.",
  },
  {
    question: "Can I change my plan later?",
    answer: "Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the start of your next billing cycle.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor, Stripe.",
  },
  {
    question: "Is there a limit to how many nodes I can add?",
    answer: "Free plans are limited to 10 nodes per map. Pro and Team plans have unlimited nodes.",
  },
  {
    question: "Can I export my maps?",
    answer: "Yes! Free users can export as PNG. Pro and Team users can export as both PNG and PDF.",
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact us for a full refund.",
  },
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />

      <main className="pt-24">
        {/* Header */}
        <section className="py-16 relative">
          <div className="absolute inset-0 canvas-dots opacity-30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl sm:text-5xl font-bold text-foreground mb-6"
              >
                Simple, transparent pricing
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-muted-foreground mb-10"
              >
                Start free and upgrade when you need more. No hidden fees, no surprises.
              </motion.p>

              {/* Billing Toggle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-4 bg-secondary rounded-xl p-1"
              >
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    billingCycle === "monthly"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    billingCycle === "yearly"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Yearly
                  <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                    Save 25%
                  </span>
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className={`relative rounded-2xl ${
                    plan.popular
                      ? "bg-gradient-to-b from-primary/10 to-transparent border-2 border-primary"
                      : "bg-card border border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="p-8">
                    <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
                    
                    <div className="mt-6">
                      <span className="text-5xl font-bold text-foreground">
                        ${billingCycle === "monthly" ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12)}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                      {billingCycle === "yearly" && plan.yearlyPrice > 0 && (
                        <p className="text-sm text-primary mt-2">
                          ${plan.yearlyPrice}/year · Save ${plan.monthlyPrice * 12 - plan.yearlyPrice}
                        </p>
                      )}
                    </div>

                    <ul className="mt-8 space-y-4">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-foreground text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={plan.ctaVariant}
                      className="w-full mt-8"
                      size="lg"
                      asChild
                    >
                      <Link to="/signup">
                        {plan.cta}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-24 bg-card/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Frequently asked questions
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to know about LinkScape pricing
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 rounded-xl bg-card border border-border"
                >
                  <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground text-sm">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Ready to get started?
              </h2>
              <p className="text-lg text-muted-foreground mb-10">
                Start your 14-day free trial today. No credit card required.
              </p>
              <Button variant="hero" size="xl" asChild>
                <Link to="/signup">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
