import type { UnifiedPostClient, UnifiedPost } from "./types";

export class JinaPostClient implements UnifiedPostClient {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canHandle(_url: string): boolean {
    return true;
  }

  async fetch(
    url: string,
    onProgress?: (message: string) => void,
  ): Promise<UnifiedPost> {
    onProgress?.("Connecting to Jina Reader API...");
    const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(jinaUrl, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`Jina Reader failed: ${response.status}`);
      }

      onProgress?.("Receiving response from Jina...");
      const markdown = await response.text();

      return {
        platform: "Other",
        markdown,
        url,
        metadata: {
          source: "Jina AI",
        },
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("Jina Reader timed out after 15s");
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
