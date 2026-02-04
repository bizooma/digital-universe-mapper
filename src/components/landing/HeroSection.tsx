import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBackground from "@/assets/hero-background.png";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      {/* Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Now in public beta</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-foreground">Map your</span>
            <br />
            <span className="text-gradient-primary">digital universe</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Visualize your entire online presence in one beautiful, interactive flowchart. 
            Connect your websites, social media, and digital properties like never before.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button variant="hero" size="xl" asChild>
              <Link to="/signup">
                Sign Up Now
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <Link to="/#features">See how it works</Link>
            </Button>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground"
          >
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-accent/80 border-2 border-background flex items-center justify-center text-xs font-medium text-primary-foreground"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span>Join 2,500+ creators mapping their digital presence</span>
          </motion.div>
        </div>

        {/* Hero Visual - Interactive Map Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="glass rounded-2xl border border-border/50 p-4 shadow-2xl">
            <div className="bg-card rounded-xl overflow-hidden">
              <MapPreview />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function MapPreview() {
  const nodes = [
    { id: "hub", label: "mysite.com", type: "website", x: 50, y: 50 },
    { id: "twitter", label: "@username", type: "social", x: 20, y: 30 },
    { id: "instagram", label: "@username", type: "social", x: 80, y: 25 },
    { id: "youtube", label: "Channel", type: "content", x: 15, y: 70 },
    { id: "linktree", label: "linktr.ee/me", type: "link", x: 85, y: 65 },
    { id: "newsletter", label: "Newsletter", type: "email", x: 50, y: 85 },
  ];

  const connections = [
    { from: "hub", to: "twitter" },
    { from: "hub", to: "instagram" },
    { from: "hub", to: "youtube" },
    { from: "hub", to: "linktree" },
    { from: "hub", to: "newsletter" },
    { from: "linktree", to: "instagram" },
  ];

  const getNodeColor = (type: string) => {
    const colors: Record<string, string> = {
      website: "from-primary to-primary/80",
      social: "from-accent to-accent/80",
      content: "from-node-content to-node-content/80",
      link: "from-node-link to-node-link/80",
      email: "from-node-email to-node-email/80",
    };
    return colors[type] || colors.website;
  };

  return (
    <div className="relative h-80 sm:h-96 canvas-grid bg-card">
      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full">
        {connections.map((conn, i) => {
          const from = nodes.find((n) => n.id === conn.from);
          const to = nodes.find((n) => n.id === conn.to);
          if (!from || !to) return null;
          return (
            <motion.line
              key={i}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
              x1={`${from.x}%`}
              y1={`${from.y}%`}
              x2={`${to.x}%`}
              y2={`${to.y}%`}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node, i) => (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          <div
            className={`px-4 py-2 rounded-lg bg-gradient-to-br ${getNodeColor(node.type)} text-primary-foreground text-sm font-medium shadow-lg ${node.id === "hub" ? "px-6 py-3 text-base" : ""}`}
          >
            {node.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
