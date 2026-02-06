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
    title: "Map and connect your entire digital world",
    description:
      "Our intuitive canvas lets you visually map every platform, website, and link in your ecosystem. See the big picture of how your audience flows between channels.",
    highlights: [
      "Simple, intuitive interface",
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

import editorPreviewImage from "@/assets/editor-preview.png";

// Visual mockup components for each feature
function EditorPreview() {
  return (
    <a 
      href="https://mapprr.com/view/02c6f01e-db35-4bb7-b7d0-874047ab46d1"
      target="_blank"
      rel="noopener noreferrer"
      className="block relative h-64 sm:h-80 rounded-xl bg-card border border-border overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group"
    >
      <img 
        src={editorPreviewImage} 
        alt="Digital presence map showing connected platforms like LinkedIn, YouTube, Facebook, Instagram, and websites"
        className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
      />
    </a>
  );
}

import themesPreviewImage from "@/assets/themes-preview.png";

function ThemesPreview() {
  return (
    <div className="relative h-64 sm:h-80 rounded-xl bg-card border border-border overflow-hidden">
      <img 
        src={themesPreviewImage} 
        alt="Map Settings dialog showing brand color options, node styles, and connection styles"
        className="w-full h-full object-cover object-center"
      />
    </div>
  );
}

import sharingPreviewImage from "@/assets/sharing-preview.png";

function SharingPreview() {
  return (
    <div className="relative h-64 sm:h-80 rounded-xl bg-card border border-border overflow-hidden">
      <img 
        src={sharingPreviewImage} 
        alt="Dashboard showing My Maps with map thumbnails, statistics, and management options"
        className="w-full h-full object-cover object-center"
      />
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
