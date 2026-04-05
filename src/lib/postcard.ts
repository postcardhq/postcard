import { z } from "zod";
import { db } from "@/db";
import { analyses, posts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { corroboratePostcard } from "./agents/corroborator";
import { auditPostcard } from "./agents/verifier";
import { unifiedPostClient } from "./ingest";
import { normalizePostUrl } from "./url";

export type ProgressCallback = (
  stage: string,
  message: string,
  progress: number,
) => void;

export const PostcardSchema = z.object({
  username: z.string().optional().describe("User handle (e.g. '@elonmusk')"),
  timestampText: z
    .string()
    .optional()
    .describe('Relative or absolute post date (e.g. "2h ago")'),
  platform: z
    .enum(["X", "YouTube", "Reddit", "Instagram", "Other"])
    .default("Other"),
  engagement: z.record(z.string(), z.string()).optional(),
  mainText: z
    .string()
    .describe("Character-for-character extraction of the primary post content"),
});

export type Postcard = z.infer<typeof PostcardSchema>;

export const CorroborationSchema = z.object({
  primarySources: z.array(
    z.object({
      url: z.string().url(),
      title: z.string(),
      source: z.string(),
      snippet: z.string(),
      relevance: z.enum(["supporting", "refuting", "neutral"]),
      publishedDate: z.string().optional(),
    }),
  ),
  queriesExecuted: z.array(
    z.object({
      query: z.string(),
      sourcesFound: z.number(),
    }),
  ),
  verdict: z.enum([
    "verified",
    "disputed",
    "inconclusive",
    "insufficient_data",
  ]),
  summary: z.string(),
  confidenceScore: z.number().min(0).max(1),
  corroborationLog: z.array(z.string()),
});

export type Corroboration = z.infer<typeof CorroborationSchema>;

export const PostcardReportSchema = z.object({
  postcard: PostcardSchema,
  markdown: z.string(), // Added to replace ocr.markdown
  triangulation: z.object({
    targetUrl: z.string().url().optional(),
    queries: z.array(z.string()),
  }),
  audit: z.object({
    originScore: z.number(),
    temporalScore: z.number(),
    totalScore: z.number(),
    auditLog: z.array(z.string()),
  }),
  corroboration: CorroborationSchema,
  timestamp: z.string().datetime(),
  analysisId: z.string().optional(),
});

export type PostcardReport = z.infer<typeof PostcardReportSchema>;

export const PostcardRequestSchema = z
  .object({
    url: z.string().url().optional(),
    image: z.string().optional(), // base64 encoded image
    userApiKey: z.string().optional(),
    forceRefresh: z.boolean().optional(),
  })
  .refine((data) => data.url || data.image, {
    message: "Either url or image must be provided",
  });

export type PostcardRequest = z.infer<typeof PostcardRequestSchema>;

export const PostcardResponseSchema = z.object({
  url: z.string().url(),
  markdown: z.string(),
  platform: z.string(),
  corroboration: CorroborationSchema,
  postcardScore: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
  analysisId: z.string().optional(),
  forensicReport: PostcardReportSchema.optional(), // Include full report if requested
});

export type PostcardResponse = z.infer<typeof PostcardResponseSchema>;

const MOCK_POSTCARD_RESPONSE: PostcardResponse = {
  url: "https://x.com/example/status/123",
  markdown:
    "## @YeOldeTweeter\n**Breaking: local man discovers that water is, in fact, wet.**\n*14h ago · 3.2K Retweets · 21.4K Likes*",
  platform: "X",
  corroboration: {
    primarySources: [
      {
        url: "https://www.nytimes.com/2025/01/15/science/water-wet-discovery.html",
        title: "Local Man Makes Historic Discovery: Water Is Wet",
        source: "nytimes.com",
        snippet: "In what experts are calling a breakthrough moment...",
        relevance: "supporting",
        publishedDate: "2025-01-15",
      },
      {
        url: "https://apnews.com/article/water-wet-discovery-abc123",
        title: "AP Investigates: The Wetness of Water",
        source: "apnews.com",
        snippet: "Scientists confirm what many suspected...",
        relevance: "supporting",
        publishedDate: "2025-01-16",
      },
    ],
    queriesExecuted: [
      { query: 'site:nytimes.com "water is wet" local man', sourcesFound: 2 },
      { query: "site:apnews.com water wet discovery", sourcesFound: 1 },
    ],
    verdict: "verified",
    summary:
      "Found 2 corroborating sources from trusted domains. Content appears verified.",
    confidenceScore: 0.85,
    corroborationLog: [
      "[MOCK] Starting corroboration for X post by @YeOldeTweeter",
      '[MOCK] Executing search query 1/5: site:nytimes.com "water is wet" local man...',
      "[MOCK] Found 2 results",
      "[MOCK] Corroboration complete: 2 sources found, 2 from trusted domains",
    ],
  },
  postcardScore: 0.85,
  timestamp: new Date().toISOString(),
};

export async function processPostcardFromUrl(
  url: string,
  userApiKey?: string,
  onProgress?: ProgressCallback,
  forceRefresh?: boolean,
): Promise<PostcardResponse & { analysisId?: string }> {
  const normalizedUrl = normalizePostUrl(url);
  const progress = (stage: string, message: string, p: number) => {
    onProgress?.(stage, message, p);
  };

  if (process.env.NEXT_PUBLIC_FAKE_PIPELINE === "true") {
    progress("complete", "Mock postcard complete", 1);
    return { ...MOCK_POSTCARD_RESPONSE };
  }

  try {
    if (!forceRefresh) {
      const cachedAnalysis = await db
        .select()
        .from(analyses)
        .innerJoin(posts, eq(posts.url, normalizedUrl))
        .orderBy(sql`${analyses.createdAt} DESC`)
        .limit(1);

      if (cachedAnalysis.length > 0) {
        const analysis = cachedAnalysis[0].analyses;
        await db
          .update(analyses)
          .set({ hits: sql`${analyses.hits} + 1` })
          .where(eq(analyses.id, analysis.id));

        return {
          url: normalizedUrl,
          markdown: cachedAnalysis[0].posts.markdown || "",
          platform: analysis.platform || "Other",
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
            summary: (analysis.summary as string) || "",
            confidenceScore: analysis.confidenceScore || 0,
            corroborationLog: JSON.parse(
              (analysis.corroborationLog as string) || "[]",
            ),
          },
          postcardScore: analysis.postcardScore,
          timestamp: analysis.createdAt.toISOString(),
          analysisId: analysis.id,
        };
      }
    }

    progress("scraping", "Fetching content via UnifiedPostClient...", 0.1);
    const post = await unifiedPostClient.fetch(url);
    const markdown = post.markdown;

    if (
      !markdown ||
      markdown.length < 50 ||
      post.platform === "Other" ||
      markdown.includes("Checking if the site connection is secure")
    ) {
      return {
        url,
        markdown: markdown || "",
        platform: post.platform || "Other",
        corroboration: {
          primarySources: [],
          queriesExecuted: [],
          verdict: "insufficient_data" as const,
          summary:
            "Unable to access this content. The link may require login or may be restricted.",
          confidenceScore: 0,
          corroborationLog: [
            "The platform blocked data ingestion or returned insufficient content.",
          ],
        },
        postcardScore: 0,
        timestamp: new Date().toISOString(),
      };
    }

    progress("scraped", `Fetched ${markdown.length} characters`, 0.3);

    const platform = post.platform;
    progress("corroborating", "Searching for primary sources...", 0.4);

    const postcard: Postcard = {
      platform: platform as Postcard["platform"],
      username: post.author,
      timestampText: post.timestamp?.toISOString(),
      mainText: markdown.slice(0, 500),
    };

    const corroboration = await corroboratePostcard(
      postcard,
      markdown,
      (msg: string) => {
        progress("corroborating", msg, 0.5);
      },
    );

    progress("auditing", "Verifying origin and temporal alignment...", 0.7);
    const audit = await auditPostcard(normalizedUrl, postcard);

    const corroborationScore = corroboration.confidenceScore;
    const supportingSources = corroboration.primarySources.filter(
      (s: { relevance: string }) => s.relevance === "supporting",
    ).length;
    const totalSources = corroboration.primarySources.length;
    const biasScore = totalSources > 0 ? supportingSources / totalSources : 0.5;

    progress("scoring", "Calculating Postcard score...", 0.9);

    const WEIGHTS = {
      ORIGIN: 0.3,
      CORROBORATION: 0.25,
      BIAS: 0.25,
      TEMPORAL: 0.2,
    };

    const postcardScore =
      audit.originScore * WEIGHTS.ORIGIN +
      corroborationScore * WEIGHTS.CORROBORATION +
      biasScore * WEIGHTS.BIAS +
      audit.temporalScore * WEIGHTS.TEMPORAL;

    const triangulationQueries = corroboration.queriesExecuted.map(
      (q) => q.query,
    );

    try {
      const existingPost = await db
        .select()
        .from(posts)
        .where(eq(posts.url, normalizedUrl))
        .limit(1);

      let pId: string;
      if (existingPost.length > 0) {
        pId = existingPost[0].id;
        // Update the post content just in case it changed
        await db
          .update(posts)
          .set({
            markdown,
            mainText: markdown.slice(0, 500),
            updatedAt: new Date(),
          })
          .where(eq(posts.id, pId));

        // Check for existing analysis to update
        const existingAnalysis = await db
          .select()
          .from(analyses)
          .where(eq(analyses.postId, pId))
          .limit(1);

        if (existingAnalysis.length > 0) {
          await db
            .update(analyses)
            .set({
              postcardScore,
              originScore: audit.originScore,
              corroborationScore: corroboration.confidenceScore,
              biasScore,
              temporalScore: audit.temporalScore,
              verdict: corroboration.verdict,
              summary: corroboration.summary,
              confidenceScore: corroboration.confidenceScore,
              primarySources: JSON.stringify(corroboration.primarySources),
              queriesExecuted: JSON.stringify(corroboration.queriesExecuted),
              corroborationLog: JSON.stringify(corroboration.corroborationLog),
              auditLog: JSON.stringify(audit.auditLog),
              status: "completed",
              updatedAt: new Date(),
              createdAt: new Date(),
            })
            .where(eq(analyses.id, existingAnalysis[0].id));
        } else {
          await db.insert(analyses).values({
            id: crypto.randomUUID(),
            postId: pId,
            url: normalizedUrl,
            platform,
            postcardScore,
            originScore: audit.originScore,
            corroborationScore: corroboration.confidenceScore,
            biasScore,
            temporalScore: audit.temporalScore,
            verdict: corroboration.verdict,
            summary: corroboration.summary,
            confidenceScore: corroboration.confidenceScore,
            primarySources: JSON.stringify(corroboration.primarySources),
            queriesExecuted: JSON.stringify(corroboration.queriesExecuted),
            corroborationLog: JSON.stringify(corroboration.corroborationLog),
            auditLog: JSON.stringify(audit.auditLog),
            status: "completed",
          });
        }
      } else {
        pId = crypto.randomUUID();
        await db.insert(posts).values({
          id: pId,
          url: normalizedUrl,
          platform,
          markdown,
          mainText: markdown.slice(0, 500),
        });

        await db.insert(analyses).values({
          id: crypto.randomUUID(),
          postId: pId,
          url: normalizedUrl,
          platform,
          postcardScore,
          originScore: audit.originScore,
          corroborationScore: corroboration.confidenceScore,
          biasScore,
          temporalScore: audit.temporalScore,
          verdict: corroboration.verdict,
          summary: corroboration.summary,
          confidenceScore: corroboration.confidenceScore,
          primarySources: JSON.stringify(corroboration.primarySources),
          queriesExecuted: JSON.stringify(corroboration.queriesExecuted),
          corroborationLog: JSON.stringify(corroboration.corroborationLog),
          auditLog: JSON.stringify(audit.auditLog),
          status: "completed",
        });
      }
      const aId = (
        await db
          .select()
          .from(analyses)
          .where(eq(analyses.postId, pId))
          .limit(1)
      )[0]?.id;

      progress("complete", "Postcard complete", 1);

      return PostcardResponseSchema.parse({
        url: normalizedUrl,
        markdown,
        platform,
        corroboration,
        postcardScore,
        timestamp: new Date().toISOString(),
        analysisId: aId,
        forensicReport: {
          postcard: {
            platform: platform as Postcard["platform"],
            mainText: markdown.slice(0, 500),
            username: postcard.username,
            timestampText: postcard.timestampText,
          },
          markdown,
          triangulation: {
            targetUrl: normalizedUrl,
            queries: triangulationQueries,
          },
          audit: {
            originScore: audit.originScore,
            temporalScore: audit.temporalScore,
            totalScore: postcardScore,
            auditLog: audit.auditLog,
          },
          corroboration,
          timestamp: new Date().toISOString(),
          analysisId: aId,
        },
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
    }

    return PostcardResponseSchema.parse({
      url,
      markdown,
      platform,
      corroboration,
      postcardScore,
      timestamp: new Date().toISOString(),
      forensicReport: {
        postcard: {
          platform: platform as Postcard["platform"],
          mainText: markdown.slice(0, 500),
          username: postcard.username,
          timestampText: postcard.timestampText,
        },
        markdown,
        triangulation: {
          targetUrl: url,
          queries: triangulationQueries,
        },
        audit: {
          originScore: audit.originScore,
          temporalScore: audit.temporalScore,
          totalScore: postcardScore,
          auditLog: audit.auditLog,
        },
        corroboration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Trace error:", error);
    throw error;
  }
}
