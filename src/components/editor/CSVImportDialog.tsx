import { useState, useCallback } from "react";
import { Upload, Download, FileSpreadsheet, AlertCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { NodeCategory } from "./LinkNode";

interface CSVRow {
  label: string;
  url: string;
  category?: string;
  platform?: string;
  notes?: string;
}

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: CSVRow[]) => void;
}

const VALID_CATEGORIES: NodeCategory[] = ["website", "social", "link", "email", "ecommerce", "content"];

// Detect platform from URL
function detectPlatform(url: string): string {
  const lowered = url.toLowerCase();
  if (lowered.includes("twitter.com") || lowered.includes("x.com")) return "twitter";
  if (lowered.includes("instagram.com")) return "instagram";
  if (lowered.includes("facebook.com")) return "facebook";
  if (lowered.includes("linkedin.com")) return "linkedin";
  if (lowered.includes("youtube.com") || lowered.includes("youtu.be")) return "youtube";
  if (lowered.includes("tiktok.com")) return "tiktok";
  if (lowered.includes("github.com")) return "github";
  if (lowered.includes("discord.com") || lowered.includes("discord.gg")) return "discord";
  if (lowered.includes("twitch.tv")) return "twitch";
  if (lowered.includes("reddit.com")) return "reddit";
  if (lowered.includes("pinterest.com")) return "pinterest";
  if (lowered.includes("medium.com")) return "medium";
  if (lowered.includes("substack.com")) return "substack";
  if (lowered.includes("spotify.com")) return "spotify";
  if (lowered.includes("apple.com/music") || lowered.includes("music.apple.com")) return "apple-music";
  if (lowered.includes("soundcloud.com")) return "soundcloud";
  if (lowered.includes("dribbble.com")) return "dribbble";
  if (lowered.includes("behance.net")) return "behance";
  if (lowered.includes("figma.com")) return "figma";
  if (lowered.includes("notion.so") || lowered.includes("notion.site")) return "notion";
  if (lowered.includes("calendly.com")) return "calendly";
  if (lowered.includes("stripe.com")) return "stripe";
  if (lowered.includes("shopify.com")) return "shopify";
  if (lowered.includes("amazon.com")) return "amazon";
  if (lowered.includes("etsy.com")) return "etsy";
  if (lowered.includes("gumroad.com")) return "gumroad";
  if (lowered.includes("patreon.com")) return "patreon";
  if (lowered.includes("ko-fi.com")) return "ko-fi";
  if (lowered.includes("buymeacoffee.com")) return "buymeacoffee";
  return "website";
}

// Detect category from platform
function detectCategory(platform: string): NodeCategory {
  const socialPlatforms = ["twitter", "instagram", "facebook", "linkedin", "tiktok", "threads", "mastodon", "bluesky", "reddit", "pinterest"];
  const contentPlatforms = ["youtube", "twitch", "spotify", "apple-music", "soundcloud", "medium", "substack", "podcast"];
  const ecommercePlatforms = ["stripe", "shopify", "amazon", "etsy", "gumroad", "patreon", "ko-fi", "buymeacoffee"];
  
  if (socialPlatforms.includes(platform)) return "social";
  if (contentPlatforms.includes(platform)) return "content";
  if (ecommercePlatforms.includes(platform)) return "ecommerce";
  return "website";
}

function parseCSV(text: string): CSVRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  // Parse header
  const header = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
  const labelIdx = header.indexOf("label");
  const urlIdx = header.indexOf("url");
  const categoryIdx = header.indexOf("category");
  const platformIdx = header.indexOf("platform");
  const notesIdx = header.indexOf("notes");

  if (labelIdx === -1 || urlIdx === -1) {
    throw new Error("CSV must have 'label' and 'url' columns");
  }

  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parsing (handles basic cases)
    const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    
    const label = values[labelIdx];
    const url = values[urlIdx];
    
    if (!label || !url) continue;

    const platform = platformIdx !== -1 && values[platformIdx] 
      ? values[platformIdx] 
      : detectPlatform(url);
    
    let category = categoryIdx !== -1 && values[categoryIdx] 
      ? values[categoryIdx] as NodeCategory
      : detectCategory(platform);
    
    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      category = "website";
    }

    rows.push({
      label,
      url,
      category,
      platform,
      notes: notesIdx !== -1 ? values[notesIdx] || "" : "",
    });
  }

  return rows;
}

export function CSVImportDialog({ open, onOpenChange, onImport }: CSVImportDialogProps) {
  const [parsedRows, setParsedRows] = useState<CSVRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    setError(null);
    setParsedRows([]);

    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCSV(text);
        if (rows.length === 0) {
          setError("No valid rows found in CSV");
          return;
        }
        setParsedRows(rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse CSV");
      }
    };
    reader.onerror = () => setError("Failed to read file");
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = () => {
    if (parsedRows.length === 0) return;
    onImport(parsedRows);
    onOpenChange(false);
    setParsedRows([]);
    toast.success(`Imported ${parsedRows.length} nodes`);
  };

  const handleDownloadTemplate = () => {
    const template = `label,url,category,platform,notes
Twitter,https://twitter.com/yourhandle,social,twitter,Main account
Website,https://yoursite.com,website,website,Portfolio
YouTube,https://youtube.com/@yourchannel,content,youtube,Video content`;
    
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "linkscape-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    onOpenChange(false);
    setParsedRows([]);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk-create nodes on your map.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            }`}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop your CSV file here, or
            </p>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id="csv-upload"
            />
            <Button variant="outline" size="sm" asChild>
              <label htmlFor="csv-upload" className="cursor-pointer">
                Browse Files
              </label>
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {parsedRows.length} nodes ready to import
                </span>
                <Check className="h-4 w-4 text-primary" />
              </div>
              <ScrollArea className="h-48 rounded-lg border border-border p-2">
                <div className="space-y-1">
                  {parsedRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-secondary/50 text-sm"
                    >
                      <span className="font-medium truncate">{row.label}</span>
                      <span className="text-xs text-muted-foreground truncate ml-2">
                        {row.platform}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={handleImport}
              disabled={parsedRows.length === 0}
              className="flex-1"
            >
              Import {parsedRows.length > 0 && `(${parsedRows.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
