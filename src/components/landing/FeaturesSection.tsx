import { motion } from "framer-motion";
import {
  MousePointer,
  Palette,
  Share2,
  BarChart3,
  Check,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  Mail,
  Link2,
} from "lucide-react";

// Main features with detailed descriptions and visual previews
const mainFeatures = [
  {
    badge: "Visual Editor",
    title: "Drag, drop, and connect your entire digital world",
    description:
      "Our intuitive canvas lets you visually map every platform, website, and link in your ecosystem. See the big picture of how your audience flows between channels.",
    highlights: [
      "Intuitive drag & drop interface",
      "Smart connection lines that auto-route",
      "Zoom, pan, and organize freely",
    ],
    visual: "editor",
  },
  {
    badge: "Customization",
    title: "Make it yours with powerful theming",
    description:
      "Choose from beautiful pre-built themes or create your own. Customize colors, node shapes, and connection styles to match your brand perfectly.",
    highlights: [
      "Multiple color themes",
      "Custom node shapes & sizes",
      "Brand color integration",
    ],
    visual: "themes",
  },
  {
    badge: "Sharing",
    title: "Share anywhere, track everything",
    description:
      "Generate beautiful public links, embed maps on your website, or export high-resolution images. Track views and understand how people explore your digital presence.",
    highlights: [
      "Public shareable links",
      "Embeddable widgets",
      "PNG & PDF exports",
    ],
    visual: "sharing",
  },
];

// Visual mockup components for each feature
function EditorPreview() {
  const nodes = [
    { label: "mysite.com", icon: Globe, x: 50, y: 35, color: "bg-primary" },
    { label: "@social", icon: Instagram, x: 20, y: 20, color: "bg-accent" },
    { label: "@twitter", icon: Twitter, x: 80, y: 20, color: "bg-accent" },
    { label: "YouTube", icon: Youtube, x: 25, y: 65, color: "bg-emerald-500" },
    { label: "Newsletter", icon: Mail, x: 75, y: 65, color: "bg-rose-500" },
  ];

  return (
    <div className="relative h-64 sm:h-80 rounded-xl bg-card border border-border overflow-hidden canvas-dots">
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full">
        <line x1="50%" y1="35%" x2="20%" y2="20%" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.4" />
        <line x1="50%" y1="35%" x2="80%" y2="20%" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.4" />
        <line x1="50%" y1="35%" x2="25%" y2="65%" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.4" />
        <line x1="50%" y1="35%" x2="75%" y2="65%" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.4" />
      </svg>
      
      {/* Nodes */}
      {nodes.map((node, i) => (
        <motion.div
          key={node.label}
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + i * 0.1 }}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${node.color} text-white text-xs font-medium shadow-lg`}>
            <node.icon className="h-3.5 w-3.5" />
            {node.label}
          </div>
        </motion.div>
      ))}

      {/* Cursor animation */}
      <motion.div
        className="absolute w-4 h-4"
        initial={{ left: "30%", top: "50%" }}
        animate={{ left: ["30%", "60%", "45%", "30%"], top: ["50%", "40%", "55%", "50%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <MousePointer className="h-4 w-4 text-foreground drop-shadow-md" />
      </motion.div>
    </div>
  );
}

function ThemesPreview() {
  const themes = [
    { name: "Ocean", colors: ["bg-blue-500", "bg-cyan-400", "bg-teal-500"] },
    { name: "Sunset", colors: ["bg-orange-500", "bg-rose-400", "bg-pink-500"] },
    { name: "Forest", colors: ["bg-emerald-500", "bg-green-400", "bg-lime-500"] },
    { name: "Purple", colors: ["bg-violet-500", "bg-purple-400", "bg-indigo-500"] },
  ];

  return (
    <div className="relative h-64 sm:h-80 rounded-xl bg-card border border-border overflow-hidden p-6">
      <div className="grid grid-cols-2 gap-4 h-full">
        {themes.map((theme, i) => (
          <motion.div
            key={theme.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className={`rounded-lg bg-muted/50 border border-border p-3 hover:border-primary/50 transition-colors cursor-pointer ${i === 0 ? 'ring-2 ring-primary' : ''}`}
          >
            <div className="flex gap-1.5 mb-2">
              {theme.colors.map((color, j) => (
                <div key={j} className={`w-4 h-4 rounded-full ${color}`} />
              ))}
            </div>
            <p className="text-xs font-medium text-foreground">{theme.name}</p>
            <div className="mt-2 space-y-1.5">
              <div className={`h-1.5 rounded-full ${theme.colors[0]} w-3/4`} />
              <div className={`h-1.5 rounded-full ${theme.colors[1]} w-1/2`} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SharingPreview() {
  return (
    <div className="relative h-64 sm:h-80 rounded-xl bg-card border border-border overflow-hidden p-6">
      <div className="space-y-4">
        {/* Share link card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-muted/50 rounded-lg p-4 border border-border"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Public Link</p>
              <p className="text-xs text-muted-foreground truncate">linkscape.app/map/your-universe</p>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium">
              Copy
            </div>
          </div>
        </motion.div>

        {/* Analytics preview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="bg-muted/50 rounded-lg p-4 border border-border"
        >
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="h-5 w-5 text-accent" />
            <p className="text-sm font-medium text-foreground">Views this week</p>
          </div>
          <div className="flex items-end gap-1 h-12">
            {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                whileInView={{ height: `${height}%` }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex-1 bg-accent/60 rounded-t"
              />
            ))}
          </div>
        </motion.div>

        {/* Export options */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex gap-2"
        >
          <div className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-center text-xs font-medium text-foreground">
            PNG
          </div>
          <div className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-center text-xs font-medium text-foreground">
            PDF
          </div>
          <div className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-center text-xs font-medium text-foreground">
            Embed
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const visualComponents: Record<string, () => JSX.Element> = {
  editor: EditorPreview,
  themes: ThemesPreview,
  sharing: SharingPreview,
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 lg:mb-28">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm uppercase tracking-wider"
          >
            Powerful Features
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight"
          >
            Everything you need to{" "}
            <span className="text-primary">visualize & share</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Powerful tools designed for creators, businesses, and anyone with a
            multi-platform presence.
          </motion.p>
        </div>

        {/* Main Features - Alternating Layout */}
        <div className="space-y-24 lg:space-y-32">
          {mainFeatures.map((feature, index) => {
            const VisualComponent = visualComponents[feature.visual];
            const isReversed = index % 2 === 1;

            return (
              <div
                key={feature.title}
                className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
                  isReversed ? "lg:grid-flow-dense" : ""
                }`}
              >
                {/* Text content */}
                <motion.div
                  initial={{ opacity: 0, x: isReversed ? 30 : -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className={isReversed ? "lg:col-start-2" : ""}
                >
                  <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent font-medium text-sm mb-4">
                    {feature.badge}
                  </span>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.highlights.map((highlight, i) => (
                      <motion.li
                        key={highlight}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="flex items-center gap-3 text-foreground"
                      >
                        <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-accent" />
                        </div>
                        {highlight}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                {/* Visual preview */}
                <motion.div
                  initial={{ opacity: 0, x: isReversed ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className={`relative ${isReversed ? "lg:col-start-1" : ""}`}
                >
                  {/* Glow effect behind */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl rounded-full scale-75 opacity-50" />
                  <div className="relative">
                    <VisualComponent />
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Secondary Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 lg:mt-32"
        >
          <h3 className="text-center text-xl sm:text-2xl font-bold text-foreground mb-12">
            And so much more...
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "🔒", label: "Privacy Controls" },
              { icon: "📱", label: "Mobile Responsive" },
              { icon: "⚡", label: "Auto-Layout" },
              { icon: "🏷️", label: "Smart Categories" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-center"
              >
                <span className="text-2xl mb-2 block">{item.icon}</span>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
