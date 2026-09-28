import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promote } from "../scripts/promote.mjs";

const candidate = {
  contentSha: "1".repeat(40), websiteSha: "2".repeat(40),
  runId: "123", runAttempt: "1", tag: "website-candidate-123-1", digest: "sha256:" + "3".repeat(64),
};
const page = '<!doctype html><link rel="canonical" href="https://test-devcapsule.mycodespace.ai/docs/">\n' +
  '<a href="/docs/">Guide</a><p>Literal test-devcapsule.mycodespace.ai in authored content.</p>\n';
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "website-promotion-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const manifest = {
    schema: 1, mode: "production", basePath: "/",
    builtAt: "2026-09-17T10:20:30.000Z",
    content: { revision: candidate.contentSha, dirty: false, sha256: "4".repeat(64) },
    implementation: { revision: candidate.websiteSha, dirty: false },
  };
  fs.writeFileSync(path.join(dir, "build-info.json"), JSON.stringify(manifest));
  fs.writeFileSync(path.join(dir, "index.html"), page);
  fs.writeFileSync(path.join(dir, "robots.txt"), "User-agent: *\nAllow: /\n");
  fs.writeFileSync(path.join(dir, "asset.bin"), Buffer.from([0, 255, 128, 1]));
  return { dir, manifest };
}

test("promotion preserves page bytes outside the canonical URL and leaves assets unchanged", t => {
  const { dir, manifest } = fixture(t);
  assert.equal(promote(dir, candidate), 1);
  assert.equal(fs.readFileSync(path.join(dir, "index.html"), "utf8"),
    page.replace('href="https://test-devcapsule.', 'href="https://devcapsule.'));
  assert.deepEqual(fs.readFileSync(path.join(dir, "asset.bin")), Buffer.from([0, 255, 128, 1]));
  const output = JSON.parse(fs.readFileSync(path.join(dir, "build-info.json")));
  assert.deepEqual(output.content, manifest.content);
  assert.deepEqual(output.implementation, manifest.implementation);
  assert.equal(output.builtAt, manifest.builtAt);
  assert.equal(output.promotion.archiveDigest, candidate.digest);
});

test("wrong source revision, dirty sources, preview mode and subpath candidates are rejected", t => {
  const { dir, manifest } = fixture(t);
  for (const mutate of [
    m => { m.content.revision = "5".repeat(40); },
    m => { m.implementation.dirty = true; },
    m => { m.mode = "preview"; },
    m => { m.basePath = "/devcapsule/"; },
  ]) {
    const invalid = structuredClone(manifest);
    mutate(invalid);
    fs.writeFileSync(path.join(dir, "build-info.json"), JSON.stringify(invalid));
    assert.throws(() => promote(dir, candidate));
    assert.equal(fs.readFileSync(path.join(dir, "index.html"), "utf8"), page);
  }
});

test("sitemap and robots move to the production origin; older candidates without a sitemap still promote", t => {
  const { dir } = fixture(t);
  const robots = "User-agent: *\nAllow: /\nSitemap: https://test-devcapsule.mycodespace.ai/sitemap.xml\n";
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    "  <url><loc>https://test-devcapsule.mycodespace.ai/</loc></url>\n" +
    "  <url><loc>https://test-devcapsule.mycodespace.ai/docs/</loc><lastmod>2026-09-21</lastmod></url>\n</urlset>\n";
  fs.writeFileSync(path.join(dir, "robots.txt"), robots);
  fs.writeFileSync(path.join(dir, "sitemap.xml"), sitemap);
  promote(dir, candidate);
  assert.equal(fs.readFileSync(path.join(dir, "robots.txt"), "utf8"),
    "User-agent: *\nAllow: /\nSitemap: https://devcapsule.mycodespace.ai/sitemap.xml\n");
  assert.equal(fs.readFileSync(path.join(dir, "sitemap.xml"), "utf8"),
    sitemap.replaceAll("https://test-devcapsule.", "https://devcapsule."));
  const legacy = fixture(t);
  assert.equal(promote(legacy.dir, candidate), 1);
  assert.equal(fs.readFileSync(path.join(legacy.dir, "robots.txt"), "utf8"), "User-agent: *\nAllow: /\n");
});

test("a sitemap naming another origin, an empty sitemap, or an unknown robots policy aborts promotion", t => {
  const { dir } = fixture(t);
  fs.writeFileSync(path.join(dir, "sitemap.xml"), "<urlset><url><loc>https://example.com/</loc></url></urlset>");
  assert.throws(() => promote(dir, candidate), /Unexpected sitemap origin/);
  fs.writeFileSync(path.join(dir, "sitemap.xml"), "<urlset></urlset>");
  assert.throws(() => promote(dir, candidate), /Sitemap lists no pages/);
  fs.rmSync(path.join(dir, "sitemap.xml"));
  fs.writeFileSync(path.join(dir, "robots.txt"), "User-agent: *\nDisallow: /\n");
  assert.throws(() => promote(dir, candidate), /Unexpected indexing policy/);
  assert.equal(fs.readFileSync(path.join(dir, "index.html"), "utf8"), page);
});

test("unexpected canonical origin aborts before rewriting any page", t => {
  const { dir } = fixture(t);
  fs.writeFileSync(path.join(dir, "z.html"), page.replace("test-devcapsule.mycodespace.ai", "example.com"));
  assert.throws(() => promote(dir, candidate), /Unexpected canonical origin/);
  assert.equal(fs.readFileSync(path.join(dir, "index.html"), "utf8"), page);
});
