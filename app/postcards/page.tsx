import { Suspense } from "react";
import { db } from "@/src/db";
import { postcards, posts, PostcardDb } from "@/src/db/schema";
import { eq, sql } from "drizzle-orm";
import { normalizePostUrl } from "@/src/lib/url";
import { createPostcard, processPostcardFromUrl } from "@/src/lib/postcard";
import PostcardsClient from "./postcards-client";

interface Props {
  searchParams: Promise<{ url?: string; forceRefresh?: string }>;
}

async function getPostcardsByUrl(url: string) {
  const normalized = normalizePostUrl(url);
  const result = await db
    .select()
    .from(postcards)
    .innerJoin(posts, eq(posts.id, postcards.postId))
    .where(eq(posts.url, normalized))
    .orderBy(sql`${postcards.createdAt} DESC`)
    .limit(1);

  if (result.length === 0) return null;
  const { postcards: rawPostcard, posts: rawPost } = result[0];
  return {
    postcardRow: PostcardDb.parse(rawPostcard),
    postRow: rawPost,
  };
}

export async function generateMetadata({ searchParams }: Props) {
  const { url: queryUrl } = await searchParams;

  if (!queryUrl) {
    return {
      title: "Postcard — Trace every post back to its source",
      description: "Verify social media posts with AI-powered forensics.",
    };
  }

  const decodedUrl = decodeURIComponent(queryUrl);
  const data = await getPostcardsByUrl(decodedUrl);

  if (!data) {
    const domain = decodedUrl.includes("://")
      ? decodedUrl.split("://")[1].split("/")[0]
      : "";
    return {
      title: domain ? `Tracing ${domain} Post...` : "Tracing Postcard...",
      description: `Initializing forensic trace for content from ${domain || "social media"}.`,
    };
  }

  const dbPostcard = data.postcardRow;
  const verdictMap = {
    verified: "✅ Verified",
    disputed: "❌ Disputed",
    inconclusive: "❓ Inconclusive",
    insufficient_data: "⚠️ Insufficient Data",
  };

  const verdictLabel =
    verdictMap[dbPostcard.verdict as keyof typeof verdictMap] ??
    dbPostcard.verdict;

  return {
    title: `Postcard: ${verdictLabel} (${dbPostcard.postcardScore}/100)`,
    description: dbPostcard.summary || "View the full corroboration trace.",
  };
}

export default async function PostcardsPage({ searchParams }: Props) {
  const { url: queryUrl, forceRefresh } = await searchParams;

  const decodedUrl = queryUrl ? decodeURIComponent(queryUrl) : null;
  const normalizedUrl = decodedUrl ? normalizePostUrl(decodedUrl) : null;

  let initialReport = null;
  let processingUrl = null;

  if (normalizedUrl && !forceRefresh) {
    const data = await getPostcardsByUrl(normalizedUrl);
    if (data) {
      const queriesExecuted = JSON.parse(
        data.postcardRow.queriesExecuted ?? "[]",
      );
      initialReport = {
        postcard: {
          platform:
            (data.postcardRow.platform as
              | "X"
              | "YouTube"
              | "Reddit"
              | "Instagram"
              | "Other") || "Other",
          mainText: data.postRow.mainText || "",
          username: data.postRow.username || undefined,
          timestampText: data.postRow.timestampText || undefined,
        },
        markdown: data.postRow.markdown || "",
        triangulation: {
          targetUrl: data.postcardRow.url,
          queries: queriesExecuted.map((q: { query: string }) => q.query),
        },
        audit: {
          originScore: data.postcardRow.originScore ?? 0,
          temporalScore: data.postcardRow.temporalScore ?? 0,
          totalScore: data.postcardRow.postcardScore / 100,
          auditLog: JSON.parse(data.postcardRow.auditLog ?? "[]"),
        },
        corroboration: {
          primarySources: JSON.parse(data.postcardRow.primarySources ?? "[]"),
          queriesExecuted,
          verdict:
            (data.postcardRow.verdict as
              | "verified"
              | "disputed"
              | "inconclusive"
              | "insufficient_data") ?? "insufficient_data",
          summary: data.postcardRow.summary ?? "",
          confidenceScore: data.postcardRow.confidenceScore ?? 0,
          corroborationLog: JSON.parse(
            data.postcardRow.corroborationLog ?? "[]",
          ),
        },
        timestamp: data.postcardRow.createdAt.toISOString(),
        id: data.postcardRow.id,
      };
    }
  } else if (normalizedUrl && forceRefresh) {
    const { id } = await createPostcard(normalizedUrl);
    processPostcardFromUrl(normalizedUrl, undefined, () => {}, true, id).catch(
      console.error,
    );
    processingUrl = normalizedUrl;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostcardsClient
        initialUrl={normalizedUrl}
        initialReport={initialReport}
        processingUrl={processingUrl}
      />
    </Suspense>
  );
}
