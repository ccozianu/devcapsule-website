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
for (const identity of [manifest.content, manifest.implementation])
  assert.match(identity.revision, /^[0-9a-f]{40}$/);
assert.match(manifest.content.sha256, /^[0-9a-f]{64}$/);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `Checked ${htmlFiles.length} HTML pages, ${links} local links/assets/anchors, headings, image labels, and build identities: passed.`,
  );
