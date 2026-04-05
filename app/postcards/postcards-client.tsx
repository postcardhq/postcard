"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Hero, DropZone, AnalysisJourney } from "@/components/features/landing";
import { ForensicReport } from "@/components/features/forensics";
import type { PostcardReport } from "@/src/lib/postcard";
import { normalizePostUrl } from "@/src/lib/url";

type PageStage = "upload" | "analyzing" | "results";

interface Props {
  initialUrl: string | null;
  initialReport: PostcardReport | null;
  processingUrl: string | null;
}

export default function PostcardsClient({
  initialUrl,
  initialReport,
  processingUrl,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const isForcedRefresh = useMemo(
    () => searchParams.get("forceRefresh") === "true",
    [searchParams],
  );

  const [pageStage, setPageStage] = useState<PageStage>(() => {
    if (initialUrl) {
      if (initialReport) return "results";
      if (processingUrl || isForcedRefresh) return "analyzing";
      return "upload";
    }
    return "upload";
  });

  const [postUrl] = useState<string | null>(processingUrl || initialUrl);
  const [report, setReport] = useState<PostcardReport | null>(initialReport);
  const [forceRefresh] = useState(isForcedRefresh);

  const handleUrlSubmitted = useCallback(
    (url: string) => {
      const normalized = normalizePostUrl(url);
      router.push(`/postcards?url=${encodeURIComponent(normalized)}`);
    },
    [router],
  );

  const handleReportReady = useCallback((r: PostcardReport) => {
    setReport(r);
    setPageStage("results");
  }, []);

  const handleReset = useCallback(() => {
    router.push("/postcards");
  }, [router]);

  if (pageStage === "analyzing" && postUrl) {
    return (
      <AnalysisJourney
        postUrl={postUrl}
        forceRefresh={forceRefresh}
        onComplete={handleReportReady}
        onReset={handleReset}
      />
    );
  }

  if (pageStage === "results" && report) {
    return <ForensicReport report={report} />;
  }

  return (
    <main>
      <Hero />
      <DropZone onUrlSubmitted={handleUrlSubmitted} />
    </main>
  );
}
