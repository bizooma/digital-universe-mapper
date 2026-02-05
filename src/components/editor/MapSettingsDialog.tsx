import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palette, Zap, GitBranch } from "lucide-react";

export interface MapSettings {
  primaryColor: string;
  nodeStyle: "rounded" | "square" | "pill";
  connectionStyle: "bezier" | "straight" | "step";
}

const DEFAULT_SETTINGS: MapSettings = {
  primaryColor: "#f97316", // Default coral/orange
  nodeStyle: "rounded",
  connectionStyle: "bezier",
};

const PRESET_COLORS = [
  { name: "Coral", value: "#f97316" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Purple", value: "#a855f7" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Slate", value: "#64748b" },
];

interface MapSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: MapSettings;
  onSettingsChange: (settings: MapSettings) => void;
}

export function MapSettingsDialog({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}: MapSettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<MapSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onOpenChange(false);
  };

  const handleColorChange = (color: string) => {
    setLocalSettings((prev) => ({ ...prev, primaryColor: color }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Map Settings
          </DialogTitle>
          <DialogDescription>
            Customize the appearance of your map with brand colors and visual styles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Brand Color */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Brand Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange(color.value)}
                  className={`h-10 rounded-lg border-2 transition-all ${
                    localSettings.primaryColor === color.value
                      ? "border-foreground scale-105 shadow-lg"
                      : "border-transparent hover:border-border"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Custom:</Label>
              <Input
                type="color"
                value={localSettings.primaryColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="h-8 w-14 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={localSettings.primaryColor}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder="#f97316"
                className="h-8 flex-1 font-mono text-xs"
              />
            </div>
          </div>

          {/* Node Style */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Node Style
            </Label>
            <Select
              value={localSettings.nodeStyle}
              onValueChange={(value: "rounded" | "square" | "pill") =>
                setLocalSettings((prev) => ({ ...prev, nodeStyle: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rounded">Rounded</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="pill">Pill</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Connection Style */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Connection Style
            </Label>
            <Select
              value={localSettings.connectionStyle}
              onValueChange={(value: "bezier" | "straight" | "step") =>
                setLocalSettings((prev) => ({ ...prev, connectionStyle: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bezier">Curved (Bezier)</SelectItem>
                <SelectItem value="straight">Straight</SelectItem>
                <SelectItem value="step">Step</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Preview</Label>
            <div className="flex items-center justify-center gap-4 p-4 bg-secondary/50 rounded-lg">
              <div
                className={`w-20 h-10 flex items-center justify-center text-white text-xs font-medium shadow-md ${
                  localSettings.nodeStyle === "rounded"
                    ? "rounded-lg"
                    : localSettings.nodeStyle === "pill"
                    ? "rounded-full"
                    : "rounded-none"
                }`}
                style={{ backgroundColor: localSettings.primaryColor }}
              >
                Node
              </div>
              <svg width="40" height="20">
                {localSettings.connectionStyle === "bezier" ? (
                  <path
                    d="M0,10 Q20,0 40,10"
                    fill="none"
                    stroke={localSettings.primaryColor}
                    strokeWidth="2"
                  />
                ) : localSettings.connectionStyle === "step" ? (
                  <path
                    d="M0,10 L20,10 L20,10 L40,10"
                    fill="none"
                    stroke={localSettings.primaryColor}
                    strokeWidth="2"
                  />
                ) : (
                  <line
                    x1="0"
                    y1="10"
                    x2="40"
                    y2="10"
                    stroke={localSettings.primaryColor}
                    strokeWidth="2"
                  />
                )}
              </svg>
              <div
                className={`w-20 h-10 flex items-center justify-center border-2 text-xs font-medium shadow-md bg-card ${
                  localSettings.nodeStyle === "rounded"
                    ? "rounded-lg"
                    : localSettings.nodeStyle === "pill"
                    ? "rounded-full"
                    : "rounded-none"
                }`}
                style={{ borderColor: localSettings.primaryColor }}
              >
                Link
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="hero" onClick={handleSave}>
            Apply Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { DEFAULT_SETTINGS };
