export interface UnifiedPost {
  platform: "Reddit" | "YouTube" | "X" | "Instagram" | "Other";
  title?: string;
  markdown: string;
  author?: string;
  url: string;
  timestamp?: Date;
  engagement?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface PostFetcher {
  canHandle(url: string): boolean;
  fetch(url: string): Promise<UnifiedPost>;
}
