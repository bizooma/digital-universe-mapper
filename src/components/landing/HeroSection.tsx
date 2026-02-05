import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Instagram, Twitter, Youtube, Globe, Link2, Mail } from "lucide-react";
import heroBackground from "@/assets/hero-background.png";

// Avatar data with real images from UI Avatars/reliable sources
const avatars = [
  { name: "Sarah Chen", role: "Content Creator", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" },
  { name: "Marcus Johnson", role: "Entrepreneur", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" },
  { name: "Emily Rodriguez", role: "Influencer", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" },
  { name: "David Kim", role: "Brand Manager", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" },
  { name: "Lisa Thompson", role: "Digital Marketer", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face" },
];

// Floating orbs background component
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div 
        className="absolute w-96 h-96 rounded-full bg-primary/20 blur-3xl animate-orb-float"
        style={{ top: '10%', left: '5%', animationDelay: '0s' }}
      />
      <div 
        className="absolute w-80 h-80 rounded-full bg-accent/15 blur-3xl animate-orb-float"
        style={{ top: '50%', right: '10%', animationDelay: '-7s' }}
      />
      <div 
        className="absolute w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-orb-float"
        style={{ bottom: '10%', left: '30%', animationDelay: '-14s' }}
      />
    </div>
  );
}

// Avatar stack with tooltips
function AvatarStack() {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex -space-x-3">
        {avatars.map((avatar, i) => (
          <Tooltip key={avatar.name}>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
              >
                <Avatar className="w-9 h-9 border-2 border-white/30 ring-2 ring-primary/20 hover:ring-primary/50 hover:scale-110 transition-all cursor-pointer">
                  <AvatarImage src={avatar.image} alt={avatar.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
                    {avatar.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-card/95 backdrop-blur-sm border-border">
              <p className="font-medium text-foreground">{avatar.name}</p>
              <p className="text-xs text-muted-foreground">{avatar.role}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-background/90" />
      
      {/* Floating orbs */}
      <FloatingOrbs />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8 animate-pulse-slow"
          >
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">Now in public beta</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight"
          >
            <span className="text-white">Map your</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 animate-shimmer bg-[length:200%_auto]">
              digital universe
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10"
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
            <Button variant="outline" size="xl" className="border-2 border-white/50 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/70" asChild>
              <Link to="/#features">See how it works</Link>
            </Button>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-white/70"
          >
            <AvatarStack />
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
          {/* Enhanced glass container with animated border */}
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 shadow-2xl">
            <div className="glass rounded-2xl p-4">
              <div className="bg-card rounded-xl overflow-hidden">
                <MapPreview />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function MapPreview() {
  const nodes = [
    { id: "hub", label: "mysite.com", type: "website", x: 50, y: 50, icon: Globe },
    { id: "twitter", label: "@username", type: "social", x: 20, y: 30, icon: Twitter },
    { id: "instagram", label: "@username", type: "social", x: 80, y: 25, icon: Instagram },
    { id: "youtube", label: "Channel", type: "content", x: 15, y: 70, icon: Youtube },
    { id: "linktree", label: "linktr.ee/me", type: "link", x: 85, y: 65, icon: Link2 },
    { id: "newsletter", label: "Newsletter", type: "email", x: 50, y: 85, icon: Mail },
  ];

  const connections = [
    { from: "hub", to: "twitter" },
    { from: "hub", to: "instagram" },
    { from: "hub", to: "youtube" },
    { from: "hub", to: "linktree" },
    { from: "hub", to: "newsletter" },
    { from: "linktree", to: "instagram" },
  ];

  const getNodeStyles = (type: string, isHub: boolean) => {
    const baseStyles: Record<string, { bg: string; border: string; shadow: string }> = {
      website: { 
        bg: "bg-gradient-to-br from-primary to-primary/80", 
        border: "border-primary/50",
        shadow: "shadow-primary/30"
      },
      social: { 
        bg: "bg-gradient-to-br from-accent to-accent/80", 
        border: "border-accent/50",
        shadow: "shadow-accent/30"
      },
      content: { 
        bg: "bg-gradient-to-br from-emerald-500 to-emerald-600", 
        border: "border-emerald-500/50",
        shadow: "shadow-emerald-500/30"
      },
      link: { 
        bg: "bg-gradient-to-br from-violet-500 to-violet-600", 
        border: "border-violet-500/50",
        shadow: "shadow-violet-500/30"
      },
      email: { 
        bg: "bg-gradient-to-br from-rose-500 to-rose-600", 
        border: "border-rose-500/50",
        shadow: "shadow-rose-500/30"
      },
    };
    return baseStyles[type] || baseStyles.website;
  };

  return (
    <div className="relative h-80 sm:h-96 canvas-grid bg-card">
      {/* Animated Connection Lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {connections.map((conn, i) => {
          const from = nodes.find((n) => n.id === conn.from);
          const to = nodes.find((n) => n.id === conn.to);
          if (!from || !to) return null;
          return (
            <g key={i}>
              {/* Base line */}
              <motion.line
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                x1={`${from.x}%`}
                y1={`${from.y}%`}
                x2={`${to.x}%`}
                y2={`${to.y}%`}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
              />
              {/* Animated flowing line */}
              <motion.line
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                x1={`${from.x}%`}
                y1={`${from.y}%`}
                x2={`${to.x}%`}
                y2={`${to.y}%`}
                stroke="url(#lineGradient)"
                strokeWidth="2"
                strokeDasharray="8 4"
                className="animate-gradient-flow"
              />
            </g>
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
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 animate-float-slow`}
          style={{ 
            left: `${node.x}%`, 
            top: `${node.y}%`,
            animationDelay: `${i * 0.5}s`
          }}
        >
          {/* Hub node glow effect */}
          {node.id === "hub" && (
            <div className="absolute inset-0 -m-2 rounded-xl bg-primary/20 blur-xl animate-pulse-glow" />
          )}
          <div
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl ${getNodeStyles(node.type, node.id === "hub").bg} border ${getNodeStyles(node.type, node.id === "hub").border} text-white text-sm font-medium shadow-lg ${getNodeStyles(node.type, node.id === "hub").shadow} backdrop-blur-sm ${node.id === "hub" ? "px-5 py-3 text-base" : ""} hover:scale-105 transition-transform cursor-pointer`}
          >
            <node.icon className={`${node.id === "hub" ? "h-5 w-5" : "h-4 w-4"}`} />
            {node.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
