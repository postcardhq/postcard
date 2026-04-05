"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Hero, DropZone } from "@/components/features/landing";
import { normalizePostUrl } from "@/src/lib/url";

export default function Home() {
  const router = useRouter();

  const handleUrlSubmitted = useCallback(
    (url: string) => {
      const normalized = normalizePostUrl(url);
      router.push(`/postcards?url=${encodeURIComponent(normalized)}`);
    },
    [router],
  );

  return (
    <main>
      {/* Primary hero — URL submission form lives in the sky */}
      <Hero>
        <DropZone onUrlSubmitted={handleUrlSubmitted} />
      </Hero>
    </main>
  );
}
