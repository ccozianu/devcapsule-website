import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveTarget, render, route, docsPath, sitemapEntries } from "../scripts/content.mjs";
const sha = "a".repeat(40);
const context = {
  revision: sha,
  assetKey: "main",
  assets: new Set(),
  exists: (target) => ["DEVELOPING.md", "docs/images/x.png"].includes(target),
  local(target) {
    if (target === "README.md") return "/";
    if (target === "engineering-docs/blog/2026-01-01-entry.md") return "/blog/2026-01-01-entry/";
    if (target === "docs/guides/windows-wsl2.md") return "/docs/current/guides/windows-wsl2/";
    return undefined;
  },
};
test("Markdown links keep anchors and queries, reach published pages, and become permalinks otherwise", () => {
  assert.equal(
    resolveTarget("windows-wsl2.md#before-you-start", "docs/guides/first-session.md", context),
    "/docs/current/guides/windows-wsl2/#before-you-start",
  );
  assert.equal(resolveTarget("../../README.md?from=docs#why", "docs/guides/first-session.md", context), "/?from=docs#why");
  assert.equal(route("engineering-docs/blog/README.md"), "/blog/");
  assert.equal(route("engineering-docs/blog/2026-01-01-entry.md"), "/blog/2026-01-01-entry/");
  assert.equal(docsPath("docs/README.md"), "");
  assert.equal(docsPath("docs/getting-started/first-session.md"), "getting-started/first-session/");
  assert.equal(docsPath("docs/reference/README.md"), "reference/");
  const permalink = "https://github.com/ccozianu/devcapsule/blob/" + sha + "/AGENTS.md";
  assert.equal(resolveTarget(permalink, "README.md", context), permalink);
  assert.equal(
    resolveTarget("../DEVELOPING.md", "docs/README.md", context),
    `https://github.com/ccozianu/devcapsule/blob/${sha}/DEVELOPING.md`,
  );
  assert.equal(resolveTarget("images/x.png", "docs/README.md", context), "/content-assets/main/docs/images/x.png");
  assert.throws(() => resolveTarget("missing.md", "README.md", context), /broken source link/);
  assert.throws(() => resolveTarget("../../private", "README.md", context), /escapes/);
  assert.throws(() => resolveTarget("images/missing.png", "docs/README.md", context), /missing image/);
});
test("headings use GitHub slugs, repeated headings are unique, and templates stay literal", () => {
  const result = render(
    '# Guide\n\n{{ secret }}\n\n## Hello, world!\n\n## Hello, world!\n\n```sh\necho "{{ site.password }}"\n```',
    "README.md",
    context,
  );
  assert.deepEqual(
    result.toc.map((h) => h.id),
    ["hello-world", "hello-world-1"],
  );
  assert.match(result.html, /\{\{ secret \}\}/);
  assert.match(result.html, /site.password/);
});
test("subdirectory deployment rewrites internal routes without changing external links", () => {
  const previous = process.env.SITE_BASE_PATH;
  try {
    process.env.SITE_BASE_PATH = "/devcapsule/";
    assert.equal(resolveTarget("images/x.png", "docs/README.md", context), "/devcapsule/content-assets/main/docs/images/x.png");
    assert.equal(resolveTarget("https://example.com/a", "README.md", context), "https://example.com/a");
  } finally {
    if (previous === undefined) delete process.env.SITE_BASE_PATH;
    else process.env.SITE_BASE_PATH = previous;
  }
});
test("the sitemap lists indexable pages in production builds and nothing in previews", () => {
  const pages = [
    { url: "/", indexable: true },
    { url: "/blog/2026-09-21-entry/", lastmod: "2026-09-21", indexable: true },
    { url: "/docs/devel/", indexable: false },
  ];
  assert.deepEqual(sitemapEntries(pages, "production"), [
    { loc: "/", lastmod: null },
    { loc: "/blog/2026-09-21-entry/", lastmod: "2026-09-21" },
  ]);
  assert.deepEqual(sitemapEntries(pages, "preview"), []);
});
