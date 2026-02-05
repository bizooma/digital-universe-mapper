import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, X, Loader2, Upload, Trash2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface LogoUploadProps {
  mapId: string | null;
  logoUrl: string | null;
  onLogoChange: (url: string | null) => void;
  isPro: boolean;
}

export function LogoUpload({ mapId, logoUrl, onLogoChange, isPro }: LogoUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }

    if (!user) {
      toast.error("Please log in to upload a logo");
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${mapId || "temp"}-${Date.now()}.${fileExt}`;

      // Delete old logo if exists
      if (logoUrl) {
        const oldPath = logoUrl.split("/map-logos/")[1];
        if (oldPath) {
          await supabase.storage.from("map-logos").remove([oldPath]);
        }
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from("map-logos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("map-logos")
        .getPublicUrl(fileName);

      onLogoChange(publicUrl);
      toast.success("Logo uploaded successfully!");
      setIsOpen(false);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload logo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoUrl) return;

    setIsDeleting(true);

    try {
      const oldPath = logoUrl.split("/map-logos/")[1];
      if (oldPath) {
        await supabase.storage.from("map-logos").remove([oldPath]);
      }

      onLogoChange(null);
      toast.success("Logo removed");
      setIsOpen(false);
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to remove logo");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isPro) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" title="Add Logo (Pro)">
            <ImagePlus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Upgrade to Add Logo
            </DialogTitle>
            <DialogDescription>
              Add your brand logo to maps for professional client deliverables.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h4 className="font-medium text-foreground mb-2">Pro includes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Custom logo on maps</li>
                <li>• PNG & PDF export</li>
                <li>• No watermark</li>
                <li>• Unlimited maps & nodes</li>
              </ul>
            </div>
            <Button variant="hero" className="w-full" asChild>
              <a href="/pricing">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={logoUrl ? "secondary" : "ghost"} 
          size="icon" 
          title={logoUrl ? "Change Logo" : "Add Logo"}
          className="relative"
        >
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="h-5 w-5 object-contain rounded"
            />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Map Logo</DialogTitle>
          <DialogDescription>
            Add your logo to appear in the top-left corner of your map exports.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current logo preview */}
          {logoUrl && (
            <div className="relative w-full aspect-[3/1] bg-muted rounded-lg overflow-hidden border border-border">
              <img
                src={logoUrl}
                alt="Current logo"
                className="w-full h-full object-contain p-4"
              />
              <Button
                variant="destructive"
                size="icon-sm"
                className="absolute top-2 right-2"
                onClick={handleRemoveLogo}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}

          {/* Upload area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-primary/50 hover:bg-primary/5 ${
              isUploading ? "opacity-50 pointer-events-none" : ""
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  {logoUrl ? "Upload new logo" : "Upload logo"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, SVG up to 2MB
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your logo will appear in the top-left corner of exports.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
