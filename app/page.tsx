"use client";

import { useState, useCallback } from "react";
import { Hero } from "@/components/ui/Hero";
import { DropZone } from "@/components/ui/DropZone";
import { AnalysisJourney } from "@/components/ui/AnalysisJourney";
import { ForensicReport } from "@/src/components/forensics/forensic-report";
import type { PostcardReport } from "@/src/lib/postcard";

type PageStage = "upload" | "analyzing" | "results";

export default function PostcardHome() {
  const [pageStage, setPageStage] = useState<PageStage>("upload");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const [report, setReport] = useState<PostcardReport | null>(null);

  const handleFileSubmitted = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setEvidenceFile(file);
    setEvidenceUrl(url);
    setPageStage("analyzing");
  }, []);

  const handleReportReady = useCallback((r: PostcardReport) => {
    setReport(r);
    setPageStage("results");
  }, []);

  if (pageStage === "analyzing" && evidenceFile && evidenceUrl) {
    return (
      <AnalysisJourney
        imageUrl={evidenceUrl}
        file={evidenceFile}
        onComplete={handleReportReady}
      />
    );
  }

  if (pageStage === "results" && report) {
    return <ForensicReport report={report} />;
  }

  return (
    <main>
      <Hero />
      <DropZone onFileSubmitted={handleFileSubmitted} />
    </main>
  );
}
