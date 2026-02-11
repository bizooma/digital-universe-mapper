import { supabase } from '@/integrations/supabase/client';

type FirecrawlResponse<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
  links?: string[];
};

type MapOptions = {
  search?: string;
  limit?: number;
  includeSubdomains?: boolean;
};

export interface NavItem {
  label: string;
  url: string;
  children: NavItem[];
}

export interface CrawlNavResponse {
  success: boolean;
  error?: string;
  navigation?: NavItem[];
  orphanedUrls?: string[];
}

export const firecrawlApi = {
  // Map a website to discover all URLs (fast sitemap)
  async map(url: string, options?: MapOptions): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-map', {
      body: { url, options },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Crawl a website's navigation structure
  async crawlNav(url: string): Promise<CrawlNavResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-crawl-nav', {
      body: { url },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
