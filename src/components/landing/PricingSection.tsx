import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "1 map",
      "Up to 5 nodes per map",
      "PNG export",
      "Basic support",
      "LinkScape watermark",
    ],
    cta: "Get Started",
    ctaVariant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "$8",
    period: "/month",
    yearlyPrice: "$72/year (save 25%)",
    description: "For serious creators",
    features: [
      "Unlimited maps",
      "Unlimited nodes",
      "PNG & PDF export",
      "No watermark",
      "Custom shareable URL",
      "Priority support",
      "Custom themes",
    ],
    cta: "Get Started",
    ctaVariant: "hero" as const,
    popular: true,
  },
  {
    name: "Team",
    price: "$20",
    period: "/month",
    yearlyPrice: "$192/year (save 20%)",
    description: "For teams and agencies",
    features: [
      "Everything in Pro",
      "Up to 5 team members",
      "Shared workspace",
      "Team collaboration",
      "Admin controls",
      "SSO integration",
      "API access",
    ],
    cta: "Get Started",
    ctaVariant: "outline" as const,
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary font-semibold text-sm uppercase tracking-wider"
          >
            Pricing
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-3xl sm:text-4xl font-bold text-foreground"
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Start free and upgrade when you need more. No hidden fees.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
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
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                  {plan.yearlyPrice && (
                    <p className="text-sm text-primary mt-1">{plan.yearlyPrice}</p>
                  )}
                </div>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.ctaVariant}
                  className="w-full mt-8"
                  size="lg"
                  asChild
                >
                  <Link to="/signup">{plan.cta}</Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
