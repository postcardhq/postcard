import { RedditFetcher } from "./reddit";
import { YoutubeFetcher } from "./youtube";
import { JinaFetcher } from "./jina";
import type { PostFetcher, UnifiedPost } from "./types";

export class FetcherStrategy {
  private fetchers: PostFetcher[] = [
    new RedditFetcher(),
    new YoutubeFetcher(),
    new JinaFetcher(), // Fallback
  ];

  async fetch(url: string): Promise<UnifiedPost> {
    const fetcher = this.fetchers.find((f) => f.canHandle(url));
    if (!fetcher) {
      throw new Error(`No fetcher found for URL: ${url}`);
    }

    try {
      return await fetcher.fetch(url);
    } catch (error) {
      console.warn(
        `Primary fetcher (${fetcher.constructor.name}) failed. Falling back to Jina...`,
        error,
      );
      if (fetcher instanceof JinaFetcher) throw error;
      return new JinaFetcher().fetch(url);
    }
  }
}

export const fetcher = new FetcherStrategy();
