import { NextRequest, NextResponse } from "next/server";
import {
  processPostcardFromUrl,
  PostcardRequestSchema,
  getExistingProcessingPostcard,
  createPostcard,
  updatePostcardRow,
} from "@/src/lib/postcard";
import { db } from "@/src/db";
import { postcards, posts } from "@/src/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { normalizePostUrl } from "@/src/lib/url";
import type { Corroboration } from "@/src/lib/postcard";

export const runtime = "nodejs";
export const maxDuration = 120;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

function corsResponse(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

function corsRedirect(url: string): NextResponse {
  return NextResponse.redirect(url, {
    headers: {
      ...CORS_HEADERS,
      Location: url,
    },
  });
}

interface PostcardWithPost {
  postcards: typeof postcards.$inferSelect;
  posts: typeof posts.$inferSelect;
}

function buildReport(existing: PostcardWithPost) {
  const { postcards: postcard, posts: post } = existing;
  const queriesExecuted = JSON.parse(
    (postcard.queriesExecuted as string) ?? "[]",
  ) as Array<{ query: string }>;
  return {
    postcard: {
      platform: postcard.platform,
      mainText: post.mainText ?? "",
      username: post.username ?? undefined,
      timestampText: post.timestampText ?? undefined,
    },
    markdown: post.markdown ?? "",
    triangulation: {
      targetUrl: postcard.url,
      queries: queriesExecuted.map((q) => q.query),
    },
    audit: {
      originScore: postcard.originScore ?? 0,
      temporalScore: postcard.temporalScore ?? 0,
      totalScore: (postcard.postcardScore ?? 0) / 100,
      auditLog: JSON.parse((postcard.auditLog as string) ?? "[]"),
    },
    corroboration: {
      primarySources: JSON.parse((postcard.primarySources as string) ?? "[]"),
      queriesExecuted,
      verdict:
        (postcard.verdict as Corroboration["verdict"]) ?? "insufficient_data",
      summary: postcard.summary ?? "",
      confidenceScore: postcard.confidenceScore ?? 0,
      corroborationLog: JSON.parse(
        (postcard.corroborationLog as string) ?? "[]",
      ),
    },
    timestamp: postcard.createdAt.toISOString(),
    id: postcard.id,
  };
}

async function getLatestAnalysisByUrl(url: string) {
  const normalized = normalizePostUrl(url);
  const result = await db
    .select()
    .from(postcards)
    .innerJoin(posts, eq(posts.id, postcards.postId))
    .where(eq(posts.url, normalized))
    .orderBy(sql`${postcards.createdAt} DESC`)
    .limit(1);

  if (result.length === 0) return null;
  return result[0] as PostcardWithPost;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return corsResponse(
      { error: "Missing required 'url' query parameter." },
      400,
    );
  }

  try {
    const normalized = normalizePostUrl(url);
    const existing = await getLatestAnalysisByUrl(normalized);

    if (!existing) {
      return corsResponse(
        {
          status: "not_found",
          error:
            "Analysis not found. POST to /api/postcards to initiate a new trace.",
        },
        404,
      );
    }

    const { postcards: row } = existing;

    if (row.status === "processing") {
      return corsResponse(
        {
          status: row.status,
          stage: row.stage,
          message: row.message,
          progress: row.progress,
        },
        200,
      );
    }

    if (row.status === "completed") {
      const report = buildReport(existing);
      return corsResponse(
        {
          status: row.status,
          ...report,
        },
        200,
      );
    }

    if (row.status === "failed") {
      return corsResponse(
        {
          status: row.status,
          error: row.error,
        },
        200,
      );
    }

    return corsResponse({ error: "Unknown row status" }, 500);
  } catch (error) {
    return corsResponse(
      { error: error instanceof Error ? error.message : "Postcard failed" },
      500,
    );
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    headers: CORS_HEADERS,
  });
}
