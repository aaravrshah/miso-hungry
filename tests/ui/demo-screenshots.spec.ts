import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const outputDir = path.join(process.cwd(), "artifacts", "demo-screenshots");

const viewports = [
  { height: 844, name: "mobile", width: 390 },
  { height: 1180, name: "tablet", width: 820 },
  { height: 1000, name: "desktop", width: 1440 },
];

const demoViews = [
  { name: "home", testId: "demo-view-home" },
  { name: "recipes", testId: "demo-view-recipes" },
  { name: "recipe-detail", testId: "demo-view-recipe-detail" },
  { name: "recipe-form", testId: "demo-view-recipe-form" },
  { name: "drinks", testId: "demo-view-drinks" },
  { name: "friends", testId: "demo-view-friends" },
  { name: "notifications", testId: "demo-view-notifications" },
  { name: "settings", testId: "demo-view-settings" },
];

async function waitForDemo(page: Page) {
  await page.goto("/demo");
  await expect(page.getByText("Demo mode uses local mock data only")).toBeVisible();
  await expect(page.getByTestId("demo-view-home")).toBeVisible();
}

test.describe("demo screenshots", () => {
  for (const viewport of viewports) {
    test(`captures ${viewport.name} demo screens`, async ({ page }) => {
      await mkdir(outputDir, { recursive: true });
      await page.setViewportSize({ height: viewport.height, width: viewport.width });
      await waitForDemo(page);

      for (const view of demoViews) {
        await page.getByTestId(view.testId).click();
        await expect(page.getByTestId(view.testId)).toHaveClass(/bg-stone-950/);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          fullPage: true,
          path: path.join(outputDir, `${viewport.name}-${view.name}.png`),
        });
      }
    });
  }
});
