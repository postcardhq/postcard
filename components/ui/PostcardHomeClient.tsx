"use client";

import { useState, useCallback, useEffect } from "react";
import { Hero } from "@/components/ui/Hero";
import { DropZone } from "@/components/ui/DropZone";
import { AnalysisJourney } from "@/components/ui/AnalysisJourney";
import { ForensicReport } from "@/src/components/forensics/forensic-report";
import type { PostcardReport } from "@/src/lib/postcard";
import { useSearchParams, useRouter } from "next/navigation";
import { normalizePostUrl } from "@/src/lib/url";

interface Props {
  initialUrl: string | null;
  initialReport: PostcardReport | null;
}

type PageStage = "upload" | "analyzing" | "results";

export default function PostcardHomeClient({
  initialUrl,
  initialReport,
}: Props) {
  const [pageStage, setPageStage] = useState<PageStage>(
    initialUrl ? (initialReport ? "results" : "analyzing") : "upload",
  );
  const [postUrl] = useState<string | null>(initialUrl);
  const [report, setReport] = useState<PostcardReport | null>(initialReport);
  const [forceRefresh, setForceRefresh] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Check if we just landed on a fresh URL or a refresh
    const isRefresh = searchParams.get("forceRefresh") === "true";
    if (isRefresh) {
      setTimeout(() => {
        setForceRefresh(true);
        setPageStage("analyzing");
      }, 0);
      // Strip refresh param
      router.replace(window.location.pathname, { scroll: false });
    }
  }, [searchParams, router]);

  const handleUrlSubmitted = useCallback(
    (url: string) => {
      const normalized = normalizePostUrl(url);
      // Use search param for robust URL handling
      router.push(`/?url=${encodeURIComponent(normalized)}`);
    },
    [router],
  );

  const handleReportReady = useCallback((r: PostcardReport) => {
    setReport(r);
    setPageStage("results");
  }, []);

  const handleReset = useCallback(() => {
    router.push("/");
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
