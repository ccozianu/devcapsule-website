import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { load } from "cheerio";
import { root, walk } from "./content.mjs";
import { isGoogleVerification } from "./verification.mjs";
const output = path.join(root, "_site");
const manifest = JSON.parse(
  fs.readFileSync(path.join(output, "build-info.json"), "utf8"),
);
const base = manifest.basePath;
const htmlFiles = walk(output).filter((file) => file.endsWith(".html") &&
  !isGoogleVerification(path.relative(output, file), fs.readFileSync(file, "utf8")));
const documents = new Map(
  htmlFiles.map((file) => [file, load(fs.readFileSync(file, "utf8"))]),
);
const failures = [];
let links = 0;
for (const [file, $] of documents) {
  const label = path.relative(output, file);
  if ($("html").attr("lang") !== "en")
    failures.push(`${label}: missing language`);
  if ($("h1").length !== 1) failures.push(`${label}: expected one H1`);
  if (!$("title").text().trim()) failures.push(`${label}: empty title`);
  const ids = new Set();
  $("[id]").each((_, el) => {
    const id = $(el).attr("id");
    if (ids.has(id)) failures.push(`${label}: duplicate id ${id}`);
    ids.add(id);
  });
  $("img").each((_, el) => {
    if ($(el).attr("alt") === undefined)
      failures.push(`${label}: image without alt`);
  });
  $("a[href],link[href],script[src],img[src]").each((_, el) => {
    const href = $(el).attr("href") || $(el).attr("src");
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return;
    links++;
    const current =
      "https://preview.invalid" + base + label.replace(/index\.html$/, "");
    const url = new URL(href, current);
    if (!url.pathname.startsWith(base)) {
      failures.push(`${label}: link outside base path: ${href}`);
      return;
    }
    let target = path.join(
      output,
      decodeURIComponent(url.pathname.slice(base.length)),
    );
    if (fs.existsSync(target) && fs.statSync(target).isDirectory())
      target = path.join(target, "index.html");
    if (!fs.existsSync(target)) {
      failures.push(`${label}: missing target ${href}`);
      return;
    }
    if (url.hash && documents.has(target)) {
      const id = decodeURIComponent(url.hash.slice(1));
      if (
        !documents
          .get(target)("[id]")
          .toArray()
          .some((el) => el.attribs.id === id)
      )
        failures.push(`${label}: missing anchor ${href}`);
    }
  });
}
// The sitemap must list exactly the indexable pages: every ordinary HTML page
// in a production build, nothing in a preview build (which is noindex).
const sitemapText = fs.readFileSync(path.join(output, "sitemap.xml"), "utf8");
const robots = fs.readFileSync(path.join(output, "robots.txt"), "utf8");
const locations = [...sitemapText.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
// Indexable: an ordinary page without a robots meta tag whose canonical URL
// is its own address. Aliases, noindex versions and copies pointing at
// /docs/current/ stay out of the sitemap.
const indexable = htmlFiles
  .filter((file) => path.relative(output, file) !== "404.html")
  .filter((file) => {
    const $ = documents.get(file);
    const url = base + path.relative(output, file).replace(/index\.html$/, "");
    const canonical = $("link[rel=canonical]").attr("href");
    return !$("meta[name=robots]").length && (!canonical || new URL(canonical).pathname === url);
  })
  .map((file) => base + path.relative(output, file).replace(/index\.html$/, ""));
if (manifest.mode === "production") {
  const canonicalOrigin = new URL(documents.get(path.join(output, "index.html"))("link[rel=canonical]").attr("href")).origin;
  if (!robots.includes(`Sitemap: ${canonicalOrigin}${base}sitemap.xml`))
    failures.push("robots.txt: missing sitemap reference");
  const listed = new Set(locations.map((loc) => {
    if (!loc.startsWith(canonicalOrigin + "/")) failures.push(`sitemap.xml: foreign origin ${loc}`);
    return loc.slice(canonicalOrigin.length);
  }));
  for (const url of indexable)
    if (!listed.has(url)) failures.push(`sitemap.xml: missing indexable page ${url}`);
  for (const url of listed)
    if (!indexable.includes(url)) failures.push(`sitemap.xml: lists non-indexable or unknown page ${url}`);
} else {
  if (locations.length) failures.push("sitemap.xml: preview builds must list no pages");
  if (robots.includes("Sitemap:")) failures.push("robots.txt: preview builds must not advertise a sitemap");
}
for (const identity of [manifest.content, manifest.implementation])
  assert.match(identity.revision, /^[0-9a-f]{40}$/);
assert.match(manifest.content.sha256, /^[0-9a-f]{64}$/);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `Checked ${htmlFiles.length} HTML pages, ${links} local links/assets/anchors, headings, image labels, sitemap (${locations.length} indexable pages), robots policy, and build identities: passed.`,
  );
