import { motion } from "framer-motion";
import { UserPlus, Link2, Share2 } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { useMemo } from "react";

const steps = [
  {
    icon: UserPlus,
    title: "Sign up free",
    description: "Create your account in seconds — no credit card required.",
  },
  {
    icon: Link2,
    title: "Add your links",
    description: "Drop in your websites, social profiles, and digital properties.",
  },
  {
    icon: Share2,
    title: "Share your map",
    description: "Generate a beautiful, interactive map to share anywhere.",
  },
];

export function HowItWorksSection() {
  const howToSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to create a visual site map with Mapprr",
    "description": "Create a beautiful visual map of your entire digital presence in 3 simple steps.",
    "step": steps.map((step, i) => ({
      "@type": "HowToStep",
      "position": i + 1,
      "name": step.title,
      "text": step.description,
    })),
  }), []);

  return (
    <section className="py-20 bg-card/50" id="how-it-works">
      <JsonLd data={howToSchema} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
          >
            How it works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Get your digital presence mapped in minutes
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <step.icon className="w-7 h-7 text-primary" />
              </div>
              <div className="text-sm font-medium text-primary mb-2">Step {index + 1}</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
