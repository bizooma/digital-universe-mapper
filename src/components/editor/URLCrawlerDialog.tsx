import { useState } from "react";
import { Globe, Loader2, AlertCircle, ExternalLink, ChevronRight } from "lucide-react";
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
import type { NavItem } from "@/lib/api/firecrawl";
import type { NodeCategory } from "./LinkNode";

interface SelectableNavItem {
  label: string;
  url: string;
  selected: boolean;
  depth: number;
  parentUrl?: string;
  children: SelectableNavItem[];
}

interface ImportedNode {
  label: string;
  url: string;
  category: NodeCategory;
  platform: string;
  notes: string;
  parentUrl?: string;
  isIntermediate?: boolean;
}

interface URLCrawlerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (urls: ImportedNode[]) => void;
}

// Generate label from URL path (for orphaned URLs)
function getLabelFromURL(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, "");
    if (!path || path === "/") return parsed.hostname.replace("www.", "");
    const segments = path.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    return lastSegment
      .replace(/[-_]/g, " ")
      .replace(/\.\w+$/, "")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  } catch {
    return url;
  }
}

function flattenNav(items: NavItem[], depth: number, parentUrl?: string): SelectableNavItem[] {
  return items.map(item => ({
    label: item.label,
    url: item.url,
    selected: true,
    depth,
    parentUrl,
    children: flattenNav(item.children, depth + 1, item.url),
  }));
}

function collectFlat(items: SelectableNavItem[]): SelectableNavItem[] {
  const result: SelectableNavItem[] = [];
  for (const item of items) {
    result.push(item);
    result.push(...collectFlat(item.children));
  }
  return result;
}

export function URLCrawlerDialog({ open, onOpenChange, onImport }: URLCrawlerDialogProps) {
  const [inputUrl, setInputUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [navItems, setNavItems] = useState<SelectableNavItem[]>([]);
  const [orphanItems, setOrphanItems] = useState<{ url: string; label: string; selected: boolean }[]>([]);

  const handleCrawl = async () => {
    if (!inputUrl.trim()) { setError("Please enter a URL"); return; }
    setError(null);
    setIsLoading(true);
    setNavItems([]);
    setOrphanItems([]);

    try {
      const result = await firecrawlApi.crawlNav(inputUrl);
      if (!result.success) { setError(result.error || "Failed to crawl website"); return; }

      const nav = flattenNav(result.navigation || [], 0);
      const orphans = (result.orphanedUrls || []).map(url => ({
        url, label: getLabelFromURL(url), selected: false,
      }));

      if (nav.length === 0 && orphans.length === 0) {
        setError("No pages found on this website");
        return;
      }

      setNavItems(nav);
      setOrphanItems(orphans);
    } catch (err) {
      console.error("Crawl error:", err);
      setError(err instanceof Error ? err.message : "Failed to crawl website");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle a nav item by URL
  const toggleNavItem = (url: string) => {
    const toggle = (items: SelectableNavItem[]): SelectableNavItem[] =>
      items.map(item => ({
        ...item,
        selected: item.url === url ? !item.selected : item.selected,
        children: toggle(item.children),
      }));
    setNavItems(toggle);
  };

  const toggleOrphan = (index: number) => {
    setOrphanItems(prev => prev.map((item, i) => i === index ? { ...item, selected: !item.selected } : item));
  };

  const toggleAllNav = (selected: boolean) => {
    const toggle = (items: SelectableNavItem[]): SelectableNavItem[] =>
      items.map(item => ({ ...item, selected, children: toggle(item.children) }));
    setNavItems(toggle);
  };

  const toggleAllOrphans = (selected: boolean) => {
    setOrphanItems(prev => prev.map(item => ({ ...item, selected })));
  };

  const handleImport = () => {
    const nodes: ImportedNode[] = [];

    // Add selected nav items with proper parentUrl
    const addNavNodes = (items: SelectableNavItem[]) => {
      for (const item of items) {
        if (item.selected) {
          nodes.push({
            label: item.label,
            url: item.url,
            category: "website" as NodeCategory,
            platform: "website",
            notes: "",
            parentUrl: item.parentUrl,
          });
        }
        addNavNodes(item.children);
      }
    };
    addNavNodes(navItems);

    // Add selected orphans (no parent)
    for (const item of orphanItems) {
      if (item.selected) {
        nodes.push({
          label: item.label,
          url: item.url,
          category: "website" as NodeCategory,
          platform: "website",
          notes: "",
        });
      }
    }

    if (nodes.length === 0) { toast.error("Please select at least one page"); return; }

    onImport(nodes);
    onOpenChange(false);
    setNavItems([]);
    setOrphanItems([]);
    setInputUrl("");
    toast.success(`Imported ${nodes.length} pages`);
  };

  const handleClose = () => {
    onOpenChange(false);
    setNavItems([]);
    setOrphanItems([]);
    setInputUrl("");
    setError(null);
  };

  const allNavFlat = collectFlat(navItems);
  const selectedNavCount = allNavFlat.filter(i => i.selected).length;
  const selectedOrphanCount = orphanItems.filter(i => i.selected).length;
  const totalSelected = selectedNavCount + selectedOrphanCount;
  const hasResults = (navItems.length > 0 || orphanItems.length > 0) && !isLoading;

  const renderNavItems = (items: SelectableNavItem[]) =>
    items.map(item => (
      <div key={item.url}>
        <div
          className={`flex items-center gap-3 p-2 rounded transition-colors cursor-pointer hover:bg-secondary/50 ${
            item.selected ? "bg-secondary/30" : ""
          }`}
          style={{ paddingLeft: `${item.depth * 20 + 8}px` }}
          onClick={() => toggleNavItem(item.url)}
        >
          <Checkbox
            checked={item.selected}
            onCheckedChange={() => toggleNavItem(item.url)}
            onClick={(e) => e.stopPropagation()}
          />
          {item.children.length > 0 && (
            <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.label}</p>
            <p className="text-xs text-muted-foreground truncate">{item.url}</p>
          </div>
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        {item.children.length > 0 && renderNavItems(item.children)}
      </div>
    ));

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
          <div className="flex gap-2">
            <Input placeholder="https://example.com" value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCrawl()}
              disabled={isLoading} />
            <Button onClick={handleCrawl} disabled={isLoading || !inputUrl.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crawl"}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing site navigation...</p>
              </div>
            </div>
          )}

          {hasResults && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {totalSelected} pages selected
                </span>
              </div>

              <ScrollArea className="h-72 rounded-lg border border-border">
                <div className="p-2 space-y-1">
                  {/* Navigation section */}
                  {navItems.length > 0 && (
                    <>
                      <div className="flex items-center justify-between px-2 py-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Navigation ({selectedNavCount}/{allNavFlat.length})
                        </p>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toggleAllNav(true)} className="h-5 text-[10px] px-1.5">All</Button>
                          <Button variant="ghost" size="sm" onClick={() => toggleAllNav(false)} className="h-5 text-[10px] px-1.5">None</Button>
                        </div>
                      </div>
                      {renderNavItems(navItems)}
                    </>
                  )}

                  {/* Orphan section */}
                  {orphanItems.length > 0 && (
                    <>
                      <div className="flex items-center justify-between px-2 py-1 mt-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Other Pages ({selectedOrphanCount}/{orphanItems.length})
                        </p>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toggleAllOrphans(true)} className="h-5 text-[10px] px-1.5">All</Button>
                          <Button variant="ghost" size="sm" onClick={() => toggleAllOrphans(false)} className="h-5 text-[10px] px-1.5">None</Button>
                        </div>
                      </div>
                      {orphanItems.map((item, idx) => (
                        <div key={idx}
                          className={`flex items-center gap-3 p-2 rounded transition-colors cursor-pointer hover:bg-secondary/50 ${
                            item.selected ? "bg-secondary/30" : ""
                          }`}
                          onClick={() => toggleOrphan(idx)}
                        >
                          <Checkbox checked={item.selected}
                            onCheckedChange={() => toggleOrphan(idx)}
                            onClick={(e) => e.stopPropagation()} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                          </div>
                          <a href={item.url} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {hasResults && (
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
              <Button variant="hero" onClick={handleImport} disabled={totalSelected === 0} className="flex-1">
                Import {totalSelected > 0 && `(${totalSelected})`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
