import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import heroBackground from "@/assets/hero-background.jpg";
import heroMapExample from "@/assets/hero-map-example.png";

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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 backdrop-blur-sm border border-orange-400/30 mb-8 animate-pulse-slow"
          >
            <Sparkles className="h-4 w-4 text-orange-300" />
            <span className="text-sm font-medium text-orange-200">Now in public beta</span>
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
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-rose-400 to-orange-300 animate-shimmer bg-[length:200%_auto]">
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
            <Button size="xl" className="bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98]" asChild>
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
            <span>Join other freelancers and agencies mapping their digital presence</span>
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
              <div className="rounded-xl overflow-hidden">
                <img 
                  src={heroMapExample} 
                  alt="Example digital presence map showing connected platforms like LinkedIn, YouTube, Facebook, Instagram, and websites"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

