import { test, expect } from "@playwright/test";

test.describe("GET /api/postcards", () => {
  test("returns 400 without url param", async ({ request }) => {
    const response = await request.get("/api/postcards");
    expect(response.status()).toBe(400);
  });

  test("returns 404 for unknown URL", async ({ request }) => {
    const response = await request.get(
      "/api/postcards?url=https://example.com/notfound",
    );
    expect(response.status()).toBe(404);
  });
});
