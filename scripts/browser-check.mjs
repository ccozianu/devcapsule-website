import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { root } from "./content.mjs";
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080/";
const artifacts = path.join(root, ".artifacts");
fs.mkdirSync(artifacts, { recursive: true });
const browser = await chromium.launch({ headless: true });
const routes = [
  "",
  "docs/",
  "docs/guides/first-session/",
  "blog/",
  "blog/2026-09-16-does-the-subscription-include-navier-stokes/",
  "docs/product/v1-announcement/",
];
const results = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const route of routes) {
      const response = await page.goto(new URL(route, base).href, {
        waitUntil: "networkidle",
      });
      assert.equal(response.status(), 200);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      assert.equal(
        overflow,
        false,
        `Horizontal page overflow: ${width} ${route}`,
      );
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      const violations = audit.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.map((n) => n.target),
      }));
      results.push({ width, route, violations });
      assert.equal(
        violations.length,
        0,
        JSON.stringify(results.at(-1), null, 2),
      );
      if (["", "docs/guides/first-session/", "blog/"].includes(route))
        await page.screenshot({
          path: path.join(
            artifacts,
            `${width}-${route.replaceAll("/", "-") || "home"}.png`,
          ),
          fullPage: true,
        });
    }
    await page.goto(base);
    await page.keyboard.press("Tab");
    assert.equal(await page.locator(":focus").textContent(), "Skip to content");
    await page.keyboard.press("Enter");
    assert.equal(await page.locator(":focus").getAttribute("id"), "main");
    await page
      .getByRole("link", { name: "Open your first workspace", exact: true })
      .click();
    assert.match(page.url(), /docs\/guides\/first-session\/$/);
    if (await page.locator(".mobile-toc summary").isVisible())
      await page.locator(".mobile-toc summary").click();
    await page
      .locator(width === 1440 ? ".toc-desktop" : ".mobile-toc")
      .getByRole("link", { name: "1. Get DevCapsule", exact: true })
      .click();
    assert.equal(new URL(page.url()).hash, "#1-get-devcapsule");
    assert.equal(errors.length, 0, errors.join("\n"));
    await context.close();
  }
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(new URL("docs/guides/first-session/", base).href);
  await page
    .getByRole("link", { name: "Windows & WSL2", exact: true })
    .first()
    .click();
  assert.match(page.url(), /windows-wsl2\/$/);
  assert.equal(
    await page.locator("h1").textContent(),
    "Windows: read this before installing",
  );
  await context.close();
  console.log(
    `Browser checks passed: ${results.length} page/viewport audits, no overflow or WCAG A/AA violations, keyboard navigation, anchors, and no-JavaScript navigation.`,
  );
} finally {
  fs.writeFileSync(
    path.join(artifacts, "browser-results.json"),
    JSON.stringify(results, null, 2),
  );
  await browser.close();
}
