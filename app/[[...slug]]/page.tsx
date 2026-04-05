import { Suspense } from "react";
import { db } from "@/db";
import { analyses, posts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { normalizePostUrl, reconstructUrlFromSlug } from "@/src/lib/url";
import PostcardHomeClient from "@/components/ui/postcard-home-client";
import type { PostcardReport, Corroboration } from "@/src/lib/postcard";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ url?: string; forceRefresh?: string }>;
}

async function getAnalysisByUrl(url: string) {
  const normalized = normalizePostUrl(url);
  const result = await db
    .select()
    .from(analyses)
    .innerJoin(posts, eq(posts.id, analyses.postId))
    .where(eq(posts.url, normalized))
    .orderBy(sql`${analyses.createdAt} DESC`)
    .limit(1);

  if (result.length === 0) return null;
  return result[0];
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const { url: queryUrl } = await searchParams;

  const decodedUrl = queryUrl ? decodeURIComponent(queryUrl) : null;
  const url = decodedUrl || (slug ? reconstructUrlFromSlug(slug) : "");

  if (!url) {
    return {
      title: "Postcard: Social Media Forensics",
      description: "Verify the origin and truth of viral social media posts.",
    };
  }
  const data = await getAnalysisByUrl(url);

  if (!data) {
    const domain = url.includes("://") ? url.split("://")[1].split("/")[0] : "";
    return {
      title: domain ? `Tracing ${domain} Post...` : "Tracing Postcard...",
      description: `Initializing forensic trace for content from ${domain || "social media"}.`,
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
    verdictMap[analysis.verdict as keyof typeof verdictMap] || analysis.verdict;

  return {
    title: `Postcard: ${verdictLabel} (${analysis.postcardScore}/100)`,
    description: analysis.summary || "View the full corroboration trace.",
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const { url: queryUrl } = await searchParams;

  // Prioritize direct search param over URL-in-path slug
  const decodedUrl = queryUrl ? decodeURIComponent(queryUrl) : null;
  const initialUrl = decodedUrl || (slug ? reconstructUrlFromSlug(slug) : null);
  const normalizedUrl = initialUrl ? normalizePostUrl(initialUrl) : null;

  let initialReport: PostcardReport | null = null;

  if (normalizedUrl) {
    const data = await getAnalysisByUrl(normalizedUrl);
    if (data) {
      const { analyses: analysis, posts: post } = data;
      initialReport = {
        postcard: {
          platform:
            (analysis.platform as
              | "X"
              | "YouTube"
              | "Reddit"
              | "Instagram"
              | "Other") || "Other",
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
          primarySources: JSON.parse(
            (analysis.primarySources as string) || "[]",
          ),
          queriesExecuted: JSON.parse(
            (analysis.queriesExecuted as string) || "[]",
          ),
          verdict:
            (analysis.verdict as Corroboration["verdict"]) ||
            "insufficient_data",
          summary: analysis.summary || "",
          confidenceScore: analysis.confidenceScore || 0,
          corroborationLog: JSON.parse(
            (analysis.corroborationLog as string) || "[]",
          ),
        },
        timestamp: analysis.createdAt.toISOString(),
        analysisId: analysis.id,
      };
    }
  }

  return (
    <Suspense fallback={<div>Loading Forensic Core...</div>}>
      <PostcardHomeClient
        initialUrl={normalizedUrl}
        initialReport={initialReport}
      />
    </Suspense>
  );
}
