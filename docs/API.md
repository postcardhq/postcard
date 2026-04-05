# Postcard API Documentation

> Official Hosted Docs: [Mintlify](https://www.mintlify.com/postcardhq/postcard)
> Last updated: April 2026

Postcard provides a public REST API for forensic verification of social media posts.

## Base URL

```
https://postcard.fartlabs.org/api/postcards
```

## OpenAPI specification

Developers can generate clients using our [OpenAPI JSON specification](/openapi.json).

## Interactive API reference

We provide an interactive API reference powered by [Scalar](https://scalar.com):

- **Local:** Run `npm run dev` and visit `http://localhost:3000/api/reference`
- **Hosted:** Visit [https://postcard.fartlabs.org/api/reference](https://postcard.fartlabs.org/api/reference)

## Endpoints

### Get /api/postcards

Retrieves the forensic verification result for a given URL.

**Query parameters:**

**Headers:**

**Response codes:**

**Example request:**

**Example response:**

```json
{
  "postcard": {
    "platform": "X",
    "mainText": "Post content here...",
    "username": "@username",
    "timestampText": "2h ago"
  },
  "markdown": "# Post content...",
  "triangulation": {
    "targetUrl": "https://x.com/user/status/123",
    "queries": []
  },
  "audit": {
    "originScore": 0.85,
    "temporalScore": 0.9,
    "totalScore": 0.875,
    "auditLog": [
      "Analysis initiated via direct URL submission",
      "Origin reputation based on platform ingestion client metrics"
    ]
  },
  "corroboration": {
    "primarySources": [
      {
        "url": "https://news.example.com/article",
        "title": "Related News Article",
        "source": "News",
        "snippet": "Relevant content...",
        "relevance": "supporting"
      }
    ],
    "queriesExecuted": [],
    "verdict": "verified",
    "summary": "Content has been corroborated by trusted sources.",
    "confidenceScore": 0.85,
    "corroborationLog": []
  },
  "timestamp": "2026-04-04T12:00:00.000Z",
  "analysisId": "abc-123"
}
```

### Post /api/postcards

Submits a new URL for forensic verification. Returns a Server-Sent Events (SSE) stream with progress updates.

**Headers:**

| Header         | Required | Description        |
| :------------- | :------- | :----------------- |
| `Content-Type` | Yes      | `application/json` |

**Body:**

```json
{
  "url": "https://x.com/user/status/123",
  "userApiKey": "optional-api-key",
  "forceRefresh": false
}
```

**Response:** SSE stream with events:

- `progress` - Stage updates during analysis
- `complete` - Final forensic report
- `error` - Error messages

**Example:**

```bash
curl -X POST "https://postcard.fartlabs.org/api/postcards" \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://x.com/user/status/123" }'
```

## CORS

The API includes CORS headers for cross-origin requests:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept
```

## Rate Limits

- Default: 60 requests per minute per IP (development)
- Production limits configured via Vercel Edge/Serverless functions

## Supported Platforms

- X (twitter.com)
- Reddit
- YouTube
- Instagram
- Bluesky
- Threads
- Generic (via Jina Reader fallback)
