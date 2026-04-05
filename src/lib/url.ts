/**
 * Normalizes a post URL for consistent database storage and lookup.
 * Handles cases like:
 * - x.com/abc -> https://x.com/abc
 * - https://x.com/abc/ -> https://x.com/abc
 * - x.com/abc?s=123 -> https://x.com/abc
 */
export function normalizePostUrl(url: string): string {
  if (!url) return "";

  let cleanUrl = url.trim();

  // Ensure protocol
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = `https://${cleanUrl}`;
  }

  try {
    const urlObj = new URL(cleanUrl);

    // Normalize domain and remove trailing slash from path
    const domain = urlObj.hostname.toLowerCase();
    let path = urlObj.pathname;
    if (path.endsWith("/") && path.length > 1) {
      path = path.slice(0, -1);
    }

    // Strip common social tracking parameters
    const searchParams = new URLSearchParams(urlObj.search);
    const trackingParams = ["s", "t", "ref", "ref_src", "ref_url", "utm_source"];
    trackingParams.forEach((p) => searchParams.delete(p));

    const search = searchParams.toString();
    return `${urlObj.protocol}//${domain}${path}${search ? `?${search}` : ""}`;
  } catch {
    return cleanUrl; // Fallback to raw if invalid
  }
}

/**
 * Reconstructs a URL from Next.js catch-all slug segments.
 * e.g. ["https:", "", "x.com", "abc"] -> https://x.com/abc
 */
export function reconstructUrlFromSlug(slug: string[]): string {
  if (!slug || slug.length === 0) return "";

  // Next.js slug segments for a URL might look like:
  // ["https:", "", "x.com", "abc"]
  const raw = slug.join("/");

  // Fix protocol double-slash if Next.js merged them
  return raw.replace(":/", "://");
}
