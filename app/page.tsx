"use client";

import { useState, useCallback } from "react";
import { Hero } from "@/components/ui/Hero";
import { DropZone } from "@/components/ui/DropZone";
import { AnalysisJourney } from "@/components/ui/AnalysisJourney";

type PageStage = "upload" | "analyzing";

export default function PostcardHome() {
  const [pageStage, setPageStage] = useState<PageStage>("upload");
  const [postUrl, setPostUrl] = useState<string | null>(null);

  const handleUrlSubmitted = useCallback((url: string) => {
    setPostUrl(url);
    setPageStage("analyzing");
  }, []);

  if (pageStage === "analyzing" && postUrl) {
    return <AnalysisJourney postUrl={postUrl} />;
  }

  return (
    <main>
      <Hero />
      <DropZone onUrlSubmitted={handleUrlSubmitted} />
    </main>
  );
}
