import type { UnifiedPostClient, UnifiedPost } from "./types";

export class InstagramPostClient implements UnifiedPostClient {
  canHandle(url: string): boolean {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes("instagram.com");
  }

  async fetch(url: string): Promise<UnifiedPost> {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!accessToken) {
      // Instagram oEmbed requires a Meta App access token.
      // If missing, we throw to trigger the Jina fallback.
      throw new Error(
        "Instagram oEmbed requires a Meta 'access_token'. Falling back to Jina Reader.",
      );
    }

    const oembedUrl = `https://graph.facebook.com/v16.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${accessToken}`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      throw new Error(`Instagram oEmbed failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      platform: "Instagram",
      title: `Instagram Post by ${data.author_name}`,
      markdown: data.html,
      author: data.author_name,
      url: url,
      engagement: {
        provider: "Instagram",
      },
      metadata: {
        author_url: data.author_url,
        provider_name: data.provider_name,
      },
    };
  }
}
