import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Hero } from "@/components/ui/Hero";
import { DropZone } from "@/components/ui/DropZone";
import { AnalysisJourney } from "@/components/ui/AnalysisJourney";
import { ForensicReport } from "@/src/components/forensics/forensic-report";
import type { PostcardReport } from "@/src/lib/postcard";

type PageStage = "upload" | "analyzing" | "results";

export default function PostcardHome() {
  return (
    <Suspense fallback={<div>Loading Forensic Core...</div>}>
      <PostcardHomeContent />
    </Suspense>
  );
}

function PostcardHomeContent() {
  const [pageStage, setPageStage] = useState<PageStage>("upload");
  const [postUrl, setPostUrl] = useState<string | null>(null);
  const [report, setReport] = useState<PostcardReport | null>(null);
  const [forceRefresh, setForceRefresh] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const urlParam = searchParams.get("url");
    const refreshParam = searchParams.get("forceRefresh") === "true";

    if (urlParam) {
      setTimeout(() => {
        setPostUrl(urlParam);
        setForceRefresh(refreshParam);
        setPageStage("analyzing");
      }, 0);
      // Clear params to avoid loop on refresh
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  const handleUrlSubmitted = useCallback((url: string) => {
    setPostUrl(url);
    setForceRefresh(false);
    setReport(null);
    setPageStage("analyzing");
  }, []);

  const handleReportReady = useCallback((r: PostcardReport) => {
    setReport(r);
    setPageStage("results");
  }, []);

  const handleReset = useCallback(() => {
    setPostUrl(null);
    setReport(null);
    setPageStage("upload");
  }, []);

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
