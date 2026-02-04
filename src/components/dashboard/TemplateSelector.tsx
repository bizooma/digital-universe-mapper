import { motion } from "framer-motion";
import { mapTemplates, type MapTemplate } from "@/data/mapTemplates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MapThumbnail } from "./MapThumbnail";

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: MapTemplate) => void;
}

export function TemplateSelector({ open, onOpenChange, onSelect }: TemplateSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <DialogDescription>
            Start with a pre-built layout or create from scratch
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
          {mapTemplates.map((template, index) => (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect(template)}
              className="group text-left rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-secondary/50 transition-all overflow-hidden"
            >
              {/* Preview */}
              <div className="h-24 relative">
                <MapThumbnail 
                  nodes={template.nodes} 
                  edges={template.edges}
                  width={320}
                  height={96}
                />
              </div>
              
              {/* Info */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{template.icon}</span>
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {template.name}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {template.nodes.length} nodes • {template.edges.length} connections
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
