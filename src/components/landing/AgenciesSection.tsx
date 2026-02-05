import { motion } from "framer-motion";
import { Users, Presentation, FolderOpen, Send, Sparkles, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const benefits = [
  {
    icon: Presentation,
    title: "Impress in client pitches",
    description: "Visualize their fragmented digital presence and show exactly how you'll unify it.",
  },
  {
    icon: FolderOpen,
    title: "Organize by client",
    description: "Keep every client's digital ecosystem in one place. Easy to manage, easy to update.",
  },
  {
    icon: Send,
    title: "Share instantly",
    description: "Send beautiful, interactive maps your clients can explore on any device.",
  },
];

const useCases = [
  "Social media managers mapping content ecosystems",
  "Marketing agencies auditing client presence",
  "Web designers presenting site architecture",
  "Brand consultants showing digital touchpoints",
];

export function AgenciesSection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <Building2 className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-accent">For Agencies & Freelancers</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
              Show clients their{" "}
              <span className="text-primary">digital universe</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Win more clients by visualizing their scattered online presence. 
              Create stunning maps that demonstrate your understanding of their brand 
              and present clear strategies for improvement.
            </p>

            {/* Benefits */}
            <div className="space-y-5 mb-10">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Button asChild size="lg" variant="hero">
              <Link to="/signup">
                <Sparkles className="h-4 w-4 mr-2" />
                Start impressing clients
              </Link>
            </Button>
          </motion.div>

          {/* Right: Visual mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            {/* Glow behind */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl rounded-full scale-75 opacity-50" />
            
            {/* Client presentation mockup */}
            <div className="relative bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Acme Corp</p>
                    <p className="text-xs text-muted-foreground">Digital Presence Audit</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-accent/20 text-accent text-xs font-medium">
                  Client View
                </div>
              </div>

              {/* Mini map preview */}
              <div className="relative h-48 rounded-xl bg-muted/50 border border-border overflow-hidden canvas-dots mb-4">
                {/* Simplified node visualization */}
                <svg className="absolute inset-0 w-full h-full">
                  <defs>
                    <linearGradient id="agencyLine" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>
                  <line x1="50%" y1="40%" x2="25%" y2="25%" stroke="url(#agencyLine)" strokeWidth="2" />
                  <line x1="50%" y1="40%" x2="75%" y2="25%" stroke="url(#agencyLine)" strokeWidth="2" />
                  <line x1="50%" y1="40%" x2="20%" y2="70%" stroke="url(#agencyLine)" strokeWidth="2" />
                  <line x1="50%" y1="40%" x2="80%" y2="70%" stroke="url(#agencyLine)" strokeWidth="2" />
                </svg>

                {/* Central hub */}
                <motion.div
                  className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
                    <span className="text-white font-bold text-xs">ACME</span>
                  </div>
                </motion.div>

                {/* Orbiting nodes */}
                {[
                  { label: "Web", x: "25%", y: "25%", color: "bg-blue-500" },
                  { label: "IG", x: "75%", y: "25%", color: "bg-pink-500" },
                  { label: "Blog", x: "20%", y: "70%", color: "bg-emerald-500" },
                  { label: "Shop", x: "80%", y: "70%", color: "bg-orange-500" },
                ].map((node, i) => (
                  <motion.div
                    key={node.label}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: node.x, top: node.y }}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <div className={`px-3 py-1.5 rounded-lg ${node.color} text-white text-xs font-medium shadow-lg`}>
                      {node.label}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Use cases list */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Perfect for
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {useCases.map((useCase, i) => (
                    <motion.div
                      key={useCase}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                      {useCase}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
