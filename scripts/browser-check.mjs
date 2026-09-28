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
  // Night mode: the system preference alone must pass the same audits, and the
  // header switch must override it, persist per browser, and return to the
  // system preference when the visitor switches back to it.
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: "dark",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(new URL(route, base).href, { waitUntil: "networkidle" });
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      const violations = audit.violations.map((v) => ({
        id: v.id, impact: v.impact, description: v.description,
        nodes: v.nodes.map((n) => n.target),
      }));
      results.push({ width: 1440, scheme: "dark", route, violations });
      assert.equal(violations.length, 0, JSON.stringify(results.at(-1), null, 2));
      if (route === "")
        await page.screenshot({ path: path.join(artifacts, "1440-dark-home.png"), fullPage: true });
    }
    await page.goto(base);
    const scheme = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const dark = await scheme();
    const toggle = page.getByRole("button", { name: "Night mode" });
    assert.equal(await toggle.getAttribute("aria-pressed"), "true");
    await toggle.click();
    assert.equal(await toggle.getAttribute("aria-pressed"), "false");
    const light = await scheme();
    assert.notEqual(light, dark);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await scheme(), light, "The light choice must persist across reloads");
    assert.equal(await page.evaluate(() => localStorage.getItem("theme")), "light");
    await toggle.click();
    assert.equal(await scheme(), dark);
    assert.equal(await page.evaluate(() => localStorage.getItem("theme")), null,
      "Choosing the system's scheme again removes the stored deviation");
    await page.screenshot({ path: path.join(artifacts, "1440-dark-toggle.png") });
    await context.close();
  }
  {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      colorScheme: "dark",
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await page.goto(new URL("docs/", base).href);
    assert.equal(await page.getByRole("button", { name: "Night mode" }).count(), 0,
      "The switch needs JavaScript and stays hidden without it");
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), "rgb(18, 26, 23)",
      "Without JavaScript the system preference alone selects the night palette");
    await page.screenshot({ path: path.join(artifacts, "390-dark-nojs-docs.png"), fullPage: true });
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
    `Browser checks passed: ${results.length} page/viewport/scheme audits, no overflow or WCAG A/AA violations, keyboard navigation, anchors, night-mode switch and persistence, and no-JavaScript navigation in both schemes.`,
  );
} finally {
  fs.writeFileSync(
    path.join(artifacts, "browser-results.json"),
    JSON.stringify(results, null, 2),
  );
  await browser.close();
}
