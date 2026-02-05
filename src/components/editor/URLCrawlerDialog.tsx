import { useState } from "react";
import { Globe, Loader2, AlertCircle, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { firecrawlApi } from "@/lib/api/firecrawl";
import type { NodeCategory } from "./LinkNode";

interface DiscoveredURL {
  url: string;
  label: string;
  selected: boolean;
}

interface URLCrawlerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (urls: { label: string; url: string; category: NodeCategory; platform: string; notes: string }[]) => void;
}

// Generate label from URL path
function getLabelFromURL(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, "");
    if (!path || path === "/") {
      return parsed.hostname.replace("www.", "");
    }
    // Get last segment
    const segments = path.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    // Clean up the segment
    return lastSegment
      .replace(/[-_]/g, " ")
      .replace(/\.\w+$/, "") // Remove file extension
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  } catch {
    return url;
  }
}

export function URLCrawlerDialog({ open, onOpenChange, onImport }: URLCrawlerDialogProps) {
  const [inputUrl, setInputUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discoveredUrls, setDiscoveredUrls] = useState<DiscoveredURL[]>([]);

  const handleCrawl = async () => {
    if (!inputUrl.trim()) {
      setError("Please enter a URL");
      return;
    }

    setError(null);
    setIsLoading(true);
    setDiscoveredUrls([]);

    try {
      const result = await firecrawlApi.map(inputUrl, { limit: 50 });

      if (!result.success) {
        setError(result.error || "Failed to crawl website");
        return;
      }

      const urls = result.links || [];
      if (urls.length === 0) {
        setError("No pages found on this website");
        return;
      }

      // Convert to DiscoveredURL format
      const discovered: DiscoveredURL[] = urls.map((url: string) => ({
        url,
        label: getLabelFromURL(url),
        selected: true,
      }));

      setDiscoveredUrls(discovered);
    } catch (err) {
      console.error("Crawl error:", err);
      setError(err instanceof Error ? err.message : "Failed to crawl website");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUrl = (index: number) => {
    setDiscoveredUrls(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleAll = (selected: boolean) => {
    setDiscoveredUrls(prev => prev.map(item => ({ ...item, selected })));
  };

  const handleImport = () => {
    const selected = discoveredUrls.filter(u => u.selected);
    if (selected.length === 0) {
      toast.error("Please select at least one page");
      return;
    }

    const nodes = selected.map(u => ({
      label: u.label,
      url: u.url,
      category: "website" as NodeCategory,
      platform: "website",
      notes: "",
    }));

    onImport(nodes);
    onOpenChange(false);
    setDiscoveredUrls([]);
    setInputUrl("");
    toast.success(`Imported ${nodes.length} pages`);
  };

  const handleClose = () => {
    onOpenChange(false);
    setDiscoveredUrls([]);
    setInputUrl("");
    setError(null);
  };

  const selectedCount = discoveredUrls.filter(u => u.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            URL Crawler
          </DialogTitle>
          <DialogDescription>
            Enter a website URL to discover and map all its pages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL Input */}
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCrawl()}
              disabled={isLoading}
            />
            <Button onClick={handleCrawl} disabled={isLoading || !inputUrl.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Crawl"
              )}
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Discovering pages...</p>
              </div>
            </div>
          )}

          {/* Results */}
          {discoveredUrls.length > 0 && !isLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {selectedCount} of {discoveredUrls.length} pages selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAll(true)}
                    className="h-6 text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAll(false)}
                    className="h-6 text-xs"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-64 rounded-lg border border-border">
                <div className="p-2 space-y-1">
                  {discoveredUrls.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2 rounded transition-colors cursor-pointer hover:bg-secondary/50 ${
                        item.selected ? "bg-secondary/30" : ""
                      }`}
                      onClick={() => toggleUrl(idx)}
                    >
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleUrl(idx)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Actions */}
          {discoveredUrls.length > 0 && !isLoading && (
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="hero"
                onClick={handleImport}
                disabled={selectedCount === 0}
                className="flex-1"
              >
                Import {selectedCount > 0 && `(${selectedCount})`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
