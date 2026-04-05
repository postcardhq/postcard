import { notFound } from "next/navigation";
import { db } from "@/db";
import { analyses, posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ForensicReport } from "@/src/components/forensics/forensic-report";
import type { PostcardReport, Corroboration } from "@/src/lib/postcard";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

async function getAnalysis(id: string) {
  const result = await db
    .select()
    .from(analyses)
    .innerJoin(posts, eq(posts.id, analyses.postId))
    .where(eq(analyses.id, id))
    .limit(1);

  if (result.length === 0) return null;
  return result[0];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getAnalysis(id);

  if (!data) {
    return {
      title: "Postcard Forensic Report Not Found",
    };
  }

  const { analyses: analysis } = data;
  const verdictMap = {
    verified: "✅ Verified",
    disputed: "❌ Disputed",
    inconclusive: "❓ Inconclusive",
    insufficient_data: "⚠️ Insufficient Data",
  };

  const verdictLabel =
    verdictMap[analysis.verdict as keyof typeof verdictMap] ||
    analysis.verdict;

  return {
    title: `Postcard Forensic Report: ${verdictLabel} (${analysis.postcardScore}/100)`,
    description: analysis.summary || "Forensic analysis of a viral social media post.",
    openGraph: {
      title: `Postcard Forensic Report: ${verdictLabel}`,
      description: analysis.summary || "View the full corroboration trace and audit trail.",
    },
  };
}

export default async function ReportPage({ params }: Props) {
  const { id } = await params;
  const data = await getAnalysis(id);

  if (!data) notFound();

  const { analyses: analysis, posts: post } = data;

  // Map database record to PostcardReport interface
  const report: PostcardReport = {
    postcard: {
      platform: (analysis.platform as "X" | "YouTube" | "Reddit" | "Instagram" | "Other") || "Other",
      mainText: post.mainText || "",
      username: post.username || undefined,
      timestampText: post.timestampText || undefined,
    },
    markdown: post.markdown || "",
    triangulation: {
      targetUrl: analysis.url,
      queries: [],
    },
    audit: {
      originScore: analysis.originScore || 0,
      temporalScore: analysis.temporalScore || 0,
      totalScore: analysis.postcardScore / 100,
      auditLog: JSON.parse((analysis.auditLog as string) || "[]"),
    },
    corroboration: {
      primarySources: JSON.parse((analysis.primarySources as string) || "[]"),
      queriesExecuted: JSON.parse((analysis.queriesExecuted as string) || "[]"),
      verdict: (analysis.verdict as Corroboration["verdict"]) || "insufficient_data",
      summary: analysis.summary || "",
      confidenceScore: analysis.confidenceScore || 0,
      corroborationLog: JSON.parse((analysis.corroborationLog as string) || "[]"),
    },
    timestamp: analysis.createdAt.toISOString(),
    analysisId: analysis.id,
  };

  return (
    <main className="min-h-screen bg-[var(--postal-paper)]">
      <ForensicReport report={report} />
    </main>
  );
}
