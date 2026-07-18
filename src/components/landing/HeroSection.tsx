import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

import heroBackground from "@/assets/hero-background.jpg";
import heroMapExample from "@/assets/hero-map-example.png";

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


export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      {/* Overlay for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background/95" />
      
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
            <span className="text-sm font-medium text-orange-200">Now in Soft Launch</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hero-speakable-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight"
          >
            <span className="text-white">Map your</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-rose-400 to-orange-300 animate-shimmer bg-[length:200%_auto]">
              digital universe
            </span>
          </motion.h1>

          {/* What is Mapprr - Voice SEO definition block */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="hero-speakable-description text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-4"
          >
            Mapprr is a visual site mapping tool that lets you organize your entire online presence in one beautiful, interactive flowchart.
          </motion.p>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto mb-10"
          >
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

