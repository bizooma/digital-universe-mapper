import { motion } from "framer-motion";

interface MapLogoProps {
  logoUrl: string;
}

export function MapLogo({ logoUrl }: MapLogoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute top-4 left-4 z-10 pointer-events-none"
      data-logo="true"
    >
      <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg">
        <img
          src={logoUrl}
          alt="Map logo"
          className="h-10 w-auto max-w-[120px] object-contain"
          crossOrigin="anonymous"
        />
      </div>
    </motion.div>
  );
}
