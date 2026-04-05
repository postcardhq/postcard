import { test, expect } from "@playwright/test";

test("landing page works without JavaScript", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  const html = await page.content();

  expect(html).toContain("Why It Matters");
  expect(html).toContain("In an era of digital echoes");
  expect(html).toContain("Spot the fabricated");
  expect(html).toContain("Trace the origin");
  expect(html).toContain("Trust the source");
  expect(html).toContain("Enter Postcard");
  expect(html).toContain("Ready to authenticate?");
});
