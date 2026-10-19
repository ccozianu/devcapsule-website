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
const hasSocialCard = fs.existsSync(path.join(output, "assets/social-card.png"));
let links = 0;
for (const [file, $] of documents) {
  const label = path.relative(output, file);
  if ($("html").attr("lang") !== "en")
    failures.push(`${label}: missing language`);
  if ($("h1").length !== 1) failures.push(`${label}: expected one H1`);
  const title = $("title").text().trim();
  if (!title) failures.push(`${label}: empty title`);
  if (hasSocialCard) {
    if (label === "index.html" && title === "DevCapsule · DevCapsule")
      failures.push(`${label}: doubled landing page title`);
    if (label !== "index.html" && !title.endsWith(" · DevCapsule"))
      failures.push(`${label}: title must end with " · DevCapsule"`);
    const description = $('meta[name="description"]').attr("content")?.trim() || "";
    if (!description) failures.push(`${label}: missing meta description`);
    const canonical = $("link[rel=canonical]").attr("href") || "";
    const ogTitle = $('meta[property="og:title"]').attr("content") || "";
    const twitterTitle = $('meta[name="twitter:title"]').attr("content") || "";
    const ogDesc = $('meta[property="og:description"]').attr("content")?.trim() || "";
    const twitterDesc = $('meta[name="twitter:description"]').attr("content")?.trim() || "";
    const ogUrl = $('meta[property="og:url"]').attr("content") || "";
    const ogType = $('meta[property="og:type"]').attr("content") || "";
    const ogSiteName = $('meta[property="og:site_name"]').attr("content") || "";
    const twitterCard = $('meta[name="twitter:card"]').attr("content") || "";
    const ogImage = $('meta[property="og:image"]').attr("content") || "";
    const twitterImage = $('meta[name="twitter:image"]').attr("content") || "";
    if (ogTitle !== title) failures.push(`${label}: og:title does not match <title>`);
    if (twitterTitle !== title) failures.push(`${label}: twitter:title does not match <title>`);
    if (ogDesc !== description) failures.push(`${label}: og:description does not match meta description`);
    if (twitterDesc !== description) failures.push(`${label}: twitter:description does not match meta description`);
    if (!ogUrl) failures.push(`${label}: missing og:url`);
    if (canonical && ogUrl !== canonical) failures.push(`${label}: og:url does not match canonical URL`);
    if (ogType !== "article" && ogType !== "website") failures.push(`${label}: unexpected og:type ${ogType}`);
    if (ogSiteName !== "DevCapsule") failures.push(`${label}: unexpected og:site_name ${ogSiteName}`);
    if (twitterCard !== "summary_large_image") failures.push(`${label}: unexpected twitter:card ${twitterCard}`);
    if (!ogImage) failures.push(`${label}: missing og:image`);
    if (twitterImage !== ogImage) failures.push(`${label}: twitter:image does not match og:image`);
    if (ogImage) {
      if (canonical && !ogImage.startsWith(new URL(canonical).origin + base))
        failures.push(`${label}: og:image does not use canonical origin: ${ogImage}`);
      const imageUrl = new URL(ogImage, "https://preview.invalid");
      const imageTarget = path.join(output, decodeURIComponent(imageUrl.pathname.slice(base.length)));
      if (!imageUrl.pathname.startsWith(base) || !fs.existsSync(imageTarget) || !fs.statSync(imageTarget).isFile())
        failures.push(`${label}: missing social card image ${ogImage}`);
    }
    const ldScripts = $('script[type="application/ld+json"]');
    if (ldScripts.length) {
      let ld;
      try {
        ld = JSON.parse(ldScripts.first().text());
      } catch (error) {
        failures.push(`${label}: invalid JSON-LD: ${error.message}`);
      }
      if (ld) {
        if (ld["@context"] !== "https://schema.org")
          failures.push(`${label}: JSON-LD missing schema.org @context`);
        if (label === "index.html") {
          const graph = Array.isArray(ld["@graph"]) ? ld["@graph"] : [];
          const siteNode = graph.find((n) => n["@type"] === "WebSite");
          const appNode = graph.find((n) => n["@type"] === "SoftwareApplication");
          if (!siteNode || siteNode.name !== "DevCapsule" || siteNode.url !== ogUrl || siteNode.image !== ogImage)
            failures.push(`${label}: invalid WebSite JSON-LD`);
          if (
            !appNode ||
            appNode.name !== "DevCapsule" ||
            appNode.operatingSystem !== "Linux" ||
            appNode.license !== "Apache-2.0" ||
            appNode.url !== ogUrl ||
            appNode.image !== ogImage
          )
            failures.push(`${label}: invalid SoftwareApplication JSON-LD`);
        } else if (label.startsWith("journal/") && label !== "journal/index.html") {
          if (
            ld["@type"] !== "Article" ||
            !ld.headline ||
            !/^\d{4}-\d{2}-\d{2}$/.test(ld.datePublished || "") ||
            ld.url !== ogUrl ||
            ld.image !== ogImage
          )
            failures.push(`${label}: invalid Article JSON-LD`);
        }
      }
    }
  }
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
  const checkTarget = (href) => {
    if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return;
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
  };
  $("a[href],link[href],script[src],img[src],source[src],track[src]").each((_, el) => {
    checkTarget($(el).attr("href") || $(el).attr("src"));
  });
  $("video").each((_, el) => {
    checkTarget($(el).attr("src"));
    checkTarget($(el).attr("poster"));
  });
}
// The sitemap must list exactly the indexable pages: every ordinary HTML page
// in a production build, nothing in a preview build (which is noindex).
// A candidate packaged before the sitemap existed has no sitemap.xml; the
// production workflow still checks it before a rollback, so those checks
// apply only when the file is present.
const sitemapFile = path.join(output, "sitemap.xml");
const hasSitemap = fs.existsSync(sitemapFile);
const sitemapText = hasSitemap ? fs.readFileSync(sitemapFile, "utf8") : "";
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
if (!hasSitemap) {
  console.log("No sitemap.xml: a candidate from before the sitemap; skipping the sitemap and robots reference checks.");
} else if (manifest.mode === "production") {
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
