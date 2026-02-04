import { motion } from "framer-motion";
import { 
  GitBranch, 
  Palette, 
  Share2, 
  Zap, 
  Lock, 
  Smartphone,
  Layers,
  MousePointer
} from "lucide-react";

const features = [
  {
    icon: GitBranch,
    title: "Visual Node Mapping",
    description: "Create beautiful, interactive flowcharts showing how all your digital properties connect and flow into each other.",
  },
  {
    icon: MousePointer,
    title: "Drag & Drop Builder",
    description: "Intuitive canvas where you can drag, drop, and connect nodes with ease. No design skills required.",
  },
  {
    icon: Layers,
    title: "Smart Categories",
    description: "Automatically categorize your links by type—social media, websites, newsletters, e-commerce, and more.",
  },
  {
    icon: Palette,
    title: "Custom Themes",
    description: "Personalize your map with custom colors, node shapes, and connection styles to match your brand.",
  },
  {
    icon: Share2,
    title: "Share Anywhere",
    description: "Generate public links, embed on your website, or export as PNG/PDF for presentations.",
  },
  {
    icon: Zap,
    title: "Auto-Layout",
    description: "One-click automatic arrangement keeps your map organized and visually appealing.",
  },
  {
    icon: Lock,
    title: "Privacy Controls",
    description: "Choose what's public and what stays private. Full control over your shared maps.",
  },
  {
    icon: Smartphone,
    title: "Mobile Responsive",
    description: "Your shared maps look great on any device. Edit on desktop, view anywhere.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 bg-card/50" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary font-semibold text-sm uppercase tracking-wider"
          >
            Features
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-3xl sm:text-4xl font-bold text-foreground"
          >
            Everything you need to visualize your digital presence
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Powerful tools designed for creators, businesses, and anyone with a multi-platform presence.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
