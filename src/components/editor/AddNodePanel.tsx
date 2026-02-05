import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, 
  Twitter, 
  Instagram, 
  Youtube, 
  Linkedin, 
  Link2, 
  Mail, 
  ShoppingBag,
  FileText,
  X,
  ChevronRight,
  Shield,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { NodeCategory } from "./LinkNode";

interface AddNodePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (node: {
    label: string;
    url: string;
    category: NodeCategory;
    platform: string;
    notes: string;
  }) => void;
}

const categories: {
  id: NodeCategory;
  label: string;
  icon: React.ElementType;
  platforms: { id: string; label: string; icon: React.ElementType }[];
}[] = [
  {
    id: "website",
    label: "Websites",
    icon: Globe,
    platforms: [
      { id: "website", label: "Website", icon: Globe },
      { id: "blog", label: "Blog", icon: FileText },
      { id: "portfolio", label: "Portfolio", icon: Globe },
    ],
  },
  {
    id: "social",
    label: "Social Media",
    icon: Twitter,
    platforms: [
      { id: "twitter", label: "Twitter / X", icon: Twitter },
      { id: "instagram", label: "Instagram", icon: Instagram },
      { id: "youtube", label: "YouTube", icon: Youtube },
      { id: "linkedin", label: "LinkedIn", icon: Linkedin },
      { id: "tiktok", label: "TikTok", icon: Globe },
      { id: "facebook", label: "Facebook", icon: Globe },
      { id: "threads", label: "Threads", icon: Globe },
      { id: "bluesky", label: "Bluesky", icon: Globe },
    ],
  },
  {
    id: "link",
    label: "Link Pages",
    icon: Link2,
    platforms: [
      { id: "linktree", label: "Linktree", icon: Link2 },
      { id: "biolink", label: "Bio.link", icon: Link2 },
      { id: "vanityurl", label: "Vanity URL", icon: Link2 },
    ],
  },
  {
    id: "email",
    label: "Email & Newsletter",
    icon: Mail,
    platforms: [
      { id: "newsletter", label: "Newsletter", icon: Mail },
      { id: "mailchimp", label: "Mailchimp", icon: Mail },
      { id: "convertkit", label: "ConvertKit", icon: Mail },
    ],
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    icon: ShoppingBag,
    platforms: [
      { id: "shopify", label: "Shopify", icon: ShoppingBag },
      { id: "etsy", label: "Etsy", icon: ShoppingBag },
      { id: "gumroad", label: "Gumroad", icon: ShoppingBag },
    ],
  },
  {
    id: "content",
    label: "Content Platforms",
    icon: FileText,
    platforms: [
      { id: "medium", label: "Medium", icon: FileText },
      { id: "substack", label: "Substack", icon: FileText },
      { id: "podcast", label: "Podcast", icon: Globe },
    ],
  },
  {
    id: "bbb",
    label: "Better Business Bureau",
    icon: Shield,
    platforms: [
      { id: "bbb", label: "BBB Profile", icon: Shield },
      { id: "bbb-accredited", label: "BBB Accredited", icon: Shield },
    ],
  },
  {
    id: "directories",
    label: "Directories",
    icon: BookOpen,
    platforms: [
      { id: "avvo", label: "Avvo", icon: BookOpen },
      { id: "google-business", label: "Google Business", icon: Globe },
      { id: "yelp", label: "Yelp", icon: BookOpen },
      { id: "findlaw", label: "FindLaw", icon: BookOpen },
      { id: "justia", label: "Justia", icon: BookOpen },
      { id: "martindale", label: "Martindale-Hubbell", icon: BookOpen },
      { id: "lawyers-com", label: "Lawyers.com", icon: BookOpen },
      { id: "superlawyers", label: "Super Lawyers", icon: BookOpen },
      { id: "nolo", label: "NOLO", icon: BookOpen },
      { id: "best-lawyers", label: "Best Lawyers", icon: BookOpen },
      { id: "state-bar", label: "State Bar Association", icon: BookOpen },
      { id: "lawinfo", label: "LawInfo", icon: BookOpen },
      { id: "hg-org", label: "HG.org", icon: BookOpen },
      { id: "legal-zoom", label: "LegalZoom", icon: BookOpen },
    ],
  },
];

export function AddNodePanel({ isOpen, onClose, onAdd }: AddNodePanelProps) {
  const [step, setStep] = useState<"category" | "platform" | "details">("category");
  const [selectedCategory, setSelectedCategory] = useState<typeof categories[0] | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setStep("category");
    setSelectedCategory(null);
    setSelectedPlatform("");
    setLabel("");
    setUrl("");
    setNotes("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCategorySelect = (category: typeof categories[0]) => {
    setSelectedCategory(category);
    setStep("platform");
  };

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId);
    const platform = selectedCategory?.platforms.find(p => p.id === platformId);
    setLabel(platform?.label || "");
    setStep("details");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !selectedPlatform || !label) return;

    onAdd({
      label,
      url,
      category: selectedCategory.id,
      platform: selectedPlatform,
      notes,
    });
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 shadow-2xl"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Add Node</h2>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {step === "category" && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-4">
                      Select a category for your node
                    </p>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category)}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <category.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{category.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {category.platforms.length} platforms
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {step === "platform" && selectedCategory && (
                  <div className="space-y-2">
                    <button
                      onClick={() => setStep("category")}
                      className="text-sm text-primary hover:underline mb-4 flex items-center gap-1"
                    >
                      ← Back to categories
                    </button>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select a platform
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedCategory.platforms.map((platform) => (
                        <button
                          key={platform.id}
                          onClick={() => handlePlatformSelect(platform.id)}
                          className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
                        >
                          <platform.icon className="h-5 w-5 text-primary" />
                          <span className="font-medium text-foreground text-sm">{platform.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === "details" && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setStep("platform")}
                      className="text-sm text-primary hover:underline mb-4 flex items-center gap-1"
                    >
                      ← Back to platforms
                    </button>

                    <div className="space-y-2">
                      <Label htmlFor="label">Display Name</Label>
                      <Input
                        id="label"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="e.g., My Website"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any notes..."
                        rows={3}
                      />
                    </div>

                    <Button type="submit" variant="hero" className="w-full">
                      Add Node
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
