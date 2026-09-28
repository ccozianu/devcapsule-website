import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import MarkdownIt from "markdown-it";
import GithubSlugger from "github-slugger";
import { load } from "cheerio";
import hljs from "highlight.js";
import {
  CONTRACT,
  ROLES,
  ContractError,
  repository,
  readManifest,
  readPage,
  checkTypedVersions,
  renderTokens,
  tokenValues,
  declaredVersion,
  checkDeclaredVersion,
  resolveSource,
  extractSource,
  fileExistsAt,
} from "./contract.mjs";

export { repository };
export const root = path.resolve(import.meta.dirname, "..");
// Versioned pages are rendered once with this placeholder where the version
// segment goes, so the same rendering serves /docs/<version>/ and /docs/current/.
export const SENTINEL = "__DOCS_VERSION__";
const fail = (message) => {
  throw new ContractError(message);
};

export function contentRoot() {
  const dir = process.env.CONTENT_DIR
    ? path.resolve(process.env.CONTENT_DIR)
    : fs.existsSync(path.join(root, "../devcapsule-src"))
      ? path.resolve(root, "..")
      : path.join(root, ".content");
  if (!fs.existsSync(path.join(dir, "engineering-docs/blog/README.md"))) {
    throw new Error(
      "Content checkout missing. Set CONTENT_DIR=/path/to/devcapsule or run npm run content:fetch.",
    );
  }
  return dir;
}
export function prefix() {
  const value = process.env.SITE_BASE_PATH || "/";
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(value))
    throw new Error(
      "SITE_BASE_PATH must be / or /path/ with a trailing slash.",
    );
  return value;
}
export const siteUrl = (url) => prefix() + url.replace(/^\//, "");
export function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) =>
      entry.isDirectory()
        ? walk(path.join(dir, entry.name))
        : entry.isFile()
          ? [path.join(dir, entry.name)]
          : [],
    );
}
function git(dir, args) {
  return execFileSync("git", ["-C", dir, ...args], { encoding: "utf8" }).trim();
}
export function identity(dir) {
  return {
    revision: git(dir, ["rev-parse", "HEAD"]),
    dirty: Boolean(
      git(dir, ["status", "--porcelain", "--untracked-files=normal"]),
    ),
  };
}
const encodePath = (file) => file.split("/").map(encodeURIComponent).join("/");
const isImage = (target) => /\.(?:png|jpg|jpeg|gif|svg|webp|avif)$/i.test(target);

// Routes of the unversioned pages, always built from the checkout.
export function route(file) {
  if (file === "README.md") return "/";
  if (file === "engineering-docs/blog/README.md") return "/journal/";
  if (file.startsWith("engineering-docs/blog/"))
    return (
      "/journal/" +
      file.slice("engineering-docs/blog/".length).replace(/\.md$/, "/")
    );
  throw new Error(`No unversioned route for ${file}`);
}
// The path of a documentation page inside its version: "" for the index.
export function docsPath(file) {
  if (!file.startsWith("docs/") || !file.endsWith(".md"))
    throw new Error(`Not a documentation page: ${file}`);
  const inner = file.slice("docs/".length, -".md".length);
  if (inner === "README" || inner === "index") return "";
  return inner.replace(/\/(?:README|index)$/, "") + "/";
}
// Site-relative, without the base path; templates apply the `url` filter.
export const docsUrl = (version, pagePath) => `/docs/${version}/${pagePath}`;

// Resolves one Markdown link target against the content root. `context`
// answers what is published where, so links stay inside a version, reach the
// journal and the landing page, or become GitHub permalinks at the revision.
export function resolveTarget(href, file, context) {
  if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)) return href;
  const match = href.match(/^([^?#]*)([?#].*)?$/);
  const target = path.posix.normalize(
    path.posix.join(
      href.startsWith("/") ? "" : path.posix.dirname(file),
      decodeURIComponent(match[1]).replace(/^\//, ""),
    ),
  );
  if (target.startsWith("../") || target === "..")
    fail(`${file}: link escapes the content root: ${href}`);
  const suffix = match[2] || "";
  const local = context.local(target);
  if (local !== undefined) return local + suffix;
  if (isImage(target)) {
    if (!context.exists(target)) fail(`${file}: missing image ${target}`);
    context.assets.add(target);
    return siteUrl(`/content-assets/${context.assetKey}/${encodePath(target)}`) + suffix;
  }
  if (!context.exists(target)) fail(`${file}: broken source link ${href}`);
  return `${repository}/blob/${context.revision}/${encodePath(target)}${suffix}`;
}

export function render(source, file, context) {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    highlight(code, language) {
      return language && hljs.getLanguage(language)
        ? hljs.highlight(code, { language }).value
        : "";
    },
  });
  const $ = load(md.render(source), null, false);
  const slugger = new GithubSlugger();
  $("h1,h2,h3,h4,h5,h6").each((_, element) => {
    const el = $(element);
    el.attr("id", slugger.slug(el.text()));
  });
  $("a[href], img[src]").each((_, element) => {
    const el = $(element);
    const attr = element.tagName === "img" ? "src" : "href";
    el.attr(attr, resolveTarget(el.attr(attr), file, context));
  });
  $("table").each((i, el) =>
    $(el).wrap(
      `<div class="table-scroll" role="region" aria-label="Table ${i + 1}" tabindex="0"></div>`,
    ),
  );
  $("pre").attr("tabindex", "0");
  const title = $("h1").first().text();
  if (!title) fail(`${file}: the page needs a first-level heading as its title`);
  const titleId = $("h1").first().attr("id");
  $("h1").first().remove();
  const toc = $("h2,h3")
    .map((_, el) => ({
      title: $(el).text(),
      id: $(el).attr("id"),
      sub: el.tagName === "h3",
    }))
    .get();
  const description = $("p")
    .filter((_, el) => $(el).text().trim().length > 40)
    .first()
    .text()
    .replace(/\s+/g, " ")
    .trim();
  return { title, titleId, html: $.html(), toc, description };
}
const excerpt = (text) =>
  text.length > 210 ? text.slice(0, 207).replace(/\s+\S*$/, "") + "…" : text;
const minutes = (source) => Math.max(1, Math.ceil(source.split(/\s+/).length / 220));

// --- The landing page: stable section identities (W07) ---------------------
// The README marks its sections with HTML comments, `<!-- website:NAME -->`,
// which GitHub does not render; a section runs to the next marker or to
// `<!-- website:end -->`. CONTRACT.md section 3.6 lists the names and what
// each one renders. A README without markers falls back to the original
// heading adapter, so the site builds while the producer adopts the markers.
export const LANDING_SECTIONS = ["hero", "benefits", "fit", "dogfood", "why", "comparison", "contribute"];
const MARKER = /^\s*website:([a-z-]+)\s*$/;

function sectionModel($, nodes) {
  const heading = nodes.find((n) => /^h[1-4]$/.test(n.tagName));
  const rest = nodes.filter((n) => n !== heading);
  const items = rest
    .filter((n) => n.tagName === "ul" || n.tagName === "ol")
    .flatMap((list) => $(list).children("li").toArray().map((li) => $(li).html().trim()));
  const paragraphs = rest.filter((n) => n.tagName === "p").map((n) => $.html(n));
  const subsections = [];
  for (const node of rest) {
    if (/^h[2-4]$/.test(node.tagName)) subsections.push({ heading: $(node).text(), id: $(node).attr("id"), nodes: [] });
    else if (subsections.length) subsections.at(-1).nodes.push(node);
  }
  return {
    heading: heading ? $(heading).text() : null,
    id: heading ? $(heading).attr("id") : null,
    html: rest.map((n) => $.html(n)).join("\n"),
    paragraphs,
    items,
    subsections: subsections.map((sub) => ({ heading: sub.heading, id: sub.id, html: sub.nodes.map((n) => $.html(n)).join("\n") })),
  };
}

export function landingSections(html) {
  const $ = load(html, null, false);
  const sections = {};
  let name = null;
  let nodes = [];
  const flush = () => {
    if (name) sections[name] = sectionModel($, nodes);
    nodes = [];
  };
  for (const node of $.root().contents().toArray()) {
    if (node.type === "comment") {
      const match = node.data.match(MARKER);
      if (!match) continue;
      flush();
      name = match[1] === "end" ? null : match[1];
      if (name && !LANDING_SECTIONS.includes(name))
        fail(`README.md: unknown landing section "${name}"; the contract defines ${LANDING_SECTIONS.join(", ")}`);
      if (name && sections[name]) fail(`README.md: landing section "${name}" is marked twice`);
      continue;
    }
    if (node.type === "tag" || (node.type === "text" && node.data.trim())) nodes.push(node);
  }
  flush();
  return Object.keys(sections).length ? sections : null;
}

// An item of a card list: "**Headline.** Two lines. [Link](target)".
function cardOf(itemHtml) {
  const $ = load(itemHtml, null, false);
  const headline = $("strong").first().text().replace(/[.:]\s*$/, "");
  $("strong").first().remove();
  const link = $("a").last();
  const url = link.attr("href") || null;
  const label = link.text() || null;
  if (url) link.remove();
  return { headline: headline || null, html: $.html().trim(), url, label };
}

// The original adapter, kept only for a README without markers.
function legacyLanding(html) {
  const $ = load(html, null, false);
  const sections = {};
  $("h2,h3").each((_, el) => {
    const heading = $(el);
    sections[heading.text()] = {
      heading: heading.text(),
      id: heading.attr("id"),
      html: heading.nextUntil("h2,h3").map((_, node) => $.html(node)).get().join("\n"),
    };
  });
  const essence = Object.values(sections).find((s) => s.heading.startsWith("The essence of why DevCapsule:"));
  const body = essence ? load(essence.html, null, false) : null;
  const paragraphs = body ? body("p").toArray().map((el) => body.html(el)) : [];
  const model = {};
  if (essence)
    model.hero = { heading: essence.heading.replace("The essence of why DevCapsule: ", "").replace(/^s/, "S"), id: essence.id, paragraphs: paragraphs.slice(0, 1), items: [], subsections: [], html: "" };
  if (paragraphs.length > 3)
    model.benefits = { heading: null, id: null, html: "", paragraphs: [], subsections: [], items: paragraphs.slice(2, 4).map((p) => load(p, null, false)("p").html()) };
  if (sections["Aim for engineering excellence. Keep the fun."])
    model.why = { ...sections["Aim for engineering excellence. Keep the fun."], paragraphs: [], items: [], subsections: [] };
  if (sections["But is it really needed?"])
    model.comparison = { ...sections["But is it really needed?"], paragraphs: [], items: [], subsections: [] };
  return model;
}

function landing(record, roles, rolePages) {
  const $ = load(record.html, null, false);
  const badges = $("img").toArray().map((el) => $.html($(el).closest("a").length ? $(el).closest("a") : $(el))).join(" ");
  const marked = landingSections(record.html);
  const sections = marked || legacyLanding(record.html);
  if (!sections.hero || !sections.hero.heading)
    fail("README.md: the landing page needs a hero section with a heading; mark it with <!-- website:hero --> (CONTRACT.md 3.6)");
  const benefits = (sections.benefits?.items ?? []).map(cardOf);
  if (benefits.length > 4) fail(`README.md: the benefits section lists ${benefits.length} items; the home page shows at most four`);
  const fit = sections.fit
    ? sections.fit.subsections.length ? sections.fit.subsections : [{ heading: sections.fit.heading, id: sections.fit.id, html: sections.fit.html }]
    : [];
  return {
    marked: Boolean(marked),
    badges,
    hero: {
      headline: sections.hero.heading,
      id: sections.hero.id || "hero",
      lead: sections.hero.paragraphs[0] || "",
      chips: sections.hero.items.map((item) => load(item, null, false).text().trim()),
    },
    pillars: ["getting-started", "your-project", "agents"].map((role) => ({
      role,
      title: rolePages[role].title,
      description: rolePages[role].description,
      url: roles[role],
    })),
    benefits,
    fit: { heading: sections.fit?.heading ?? null, id: sections.fit?.id ?? null, columns: fit },
    dogfood: sections.dogfood?.html ?? "",
    why: sections.why ?? null,
    comparison: sections.comparison ?? null,
    contribute: sections.contribute ?? null,
  };
}

// --- One documentation version -------------------------------------------

function humanize(dir) {
  return dir.charAt(0).toUpperCase() + dir.slice(1).replace(/-/g, " ");
}

// Renders every page of a version's docs/ tree with the version placeholder
// in its internal links. Pure with respect to (tree contents, entry.legacy,
// this code), so the result of an immutable source is cached by commit.
export function renderVersion({ entry, tree, revision, assetKey, version, blogRoutes, checkoutDir }) {
  const legacy = entry.legacy;
  const files = walk(path.join(tree, "docs"))
    .filter((p) => p.endsWith(".md"))
    .map((p) => path.relative(tree, p));
  const docsSet = new Set(files);
  const assets = new Set();
  const exists = (target) =>
    tree === checkoutDir ? fs.existsSync(path.join(tree, target)) : fileExistsAt(checkoutDir, revision, target);
  const context = {
    revision,
    assetKey,
    assets,
    exists: (target) => fs.existsSync(path.join(tree, target)) || exists(target),
    local(target) {
      if (docsSet.has(target)) return siteUrl(docsUrl(SENTINEL, docsPath(target)));
      if (target === "README.md") return siteUrl("/");
      if (blogRoutes.has(target)) return siteUrl(blogRoutes.get(target));
      return undefined;
    },
  };
  const values = tokenValues(version);
  const byPath = new Map();
  const roles = {};
  const pages = files.map((file) => {
    const source = fs.readFileSync(path.join(tree, file), "utf8");
    const { meta, body, bodyOffset, declared } = readPage(source, file, { legacy });
    let text = body;
    if (!legacy) {
      checkTypedVersions(text, file, bodyOffset);
      text = renderTokens(text, file, values, bodyOffset);
    } else {
      text = text.replace(/\{\{\s*(version|tag|release_url|download_url)\s*\}\}/g, (_, n) => values[n]);
    }
    const rendered = render(text, file, context);
    const pagePath = docsPath(file);
    if (byPath.has(pagePath))
      fail(`version ${entry.version}: ${file} and ${byPath.get(pagePath).file} would both publish at ${pagePath || "the index"}`);
    const historical =
      meta.status === "historical" ||
      (legacy && !declared && (file.includes("/product/") || file.includes("docker4pycharm")));
    if (meta.role) {
      if (roles[meta.role])
        fail(`version ${entry.version}: role "${meta.role}" is declared by both ${roles[meta.role]} and ${file}`);
      roles[meta.role] = file;
    }
    const page = {
      file,
      path: pagePath,
      title: rendered.title,
      titleId: rendered.titleId,
      html: rendered.html,
      toc: rendered.toc,
      description: meta.description ?? rendered.description,
      draft: meta.draft,
      status: meta.status,
      planned: meta.status === "planned",
      historical,
      aliases: meta.aliases,
      weight: meta.weight,
      updated: meta.updated,
      role: meta.role,
      minutes: minutes(text),
      sourceUrl: `${repository}/blob/${revision}/${encodePath(file)}`,
      area: pagePath.includes("/") ? file.split("/")[1] : null,
    };
    byPath.set(pagePath, page);
    return page;
  });
  const overview = byPath.get("");
  if (!overview) fail(`version ${entry.version}: docs/README.md is missing; every version needs its index page`);
  return { pages, assets: [...assets].sort(), roles, areas: areasOf(pages, overview, tree, legacy) };
}

// Sidebar areas: the first-level directories of docs/, in the order the
// version's overview first links them, titled by the overview's link text
// when that text is not simply the linked page's title.
function areasOf(pages, overview, tree, legacy) {
  const source = fs.readFileSync(path.join(tree, overview.file), "utf8");
  const links = [...source.matchAll(/\[([^\]]+)\]\(([^)\s#?]+)[^)]*\)/g)].map((m) => ({
    text: m[1].trim(),
    target: path.posix.normalize(path.posix.join("docs", m[2])),
  }));
  const order = [];
  const titles = {};
  for (const link of links) {
    const dir = link.target.startsWith("docs/") ? link.target.split("/")[1] : null;
    if (!dir || !link.target.endsWith(".md") || link.target.split("/").length < 3) continue;
    if (!order.includes(dir)) order.push(dir);
    const page = pages.find((p) => p.file === link.target);
    if (!legacy && !titles[dir] && page && page.title !== link.text && !/^Start here/i.test(link.text))
      titles[dir] = link.text;
  }
  const dirs = [...new Set(pages.filter((p) => p.area).map((p) => p.area))];
  const ordered = [...order.filter((d) => dirs.includes(d)), ...dirs.filter((d) => !order.includes(d)).sort()];
  return ordered.map((dir) => ({
    dir,
    title: titles[dir] || humanize(dir),
    pages: pages
      .filter((p) => p.area === dir && !p.historical)
      .sort((a, b) =>
        (a.weight ?? Infinity) - (b.weight ?? Infinity) || a.title.localeCompare(b.title),
      )
      .map((p) => p.path),
  })).filter((area) => area.pages.length);
}

function loadVersion(entry, { dir, content, cacheRoot, codeDigest, blogRoutes, stats }) {
  let tree, revision, assetKey, cached = false;
  if (entry.source === "main") {
    tree = dir;
    revision = content.revision;
    assetKey = "main";
  } else {
    revision = resolveSource(dir, entry.source);
    if (!revision)
      fail(`version ${entry.version}: source "${entry.source}" does not resolve in the content checkout; fetch its tag or branch`);
    tree = extractSource(dir, revision, cacheRoot);
    assetKey = revision.slice(0, 7);
    cached = true;
  }
  const declared = declaredVersion(
    fs.readFileSync(path.join(tree, "devcapsule-src/pyproject.toml"), "utf8"),
    `version ${entry.version} (source ${entry.source})`,
  );
  const version = checkDeclaredVersion(entry, declared);
  // The rendering embeds the base path in its links, so it is part of the key.
  const base = prefix().replace(/[^A-Za-z0-9]+/g, "_");
  const cacheFile = path.join(cacheRoot, "versions", `${revision}-${entry.legacy ? "legacy" : "strict"}-${codeDigest}-${base}.json`);
  let rendered;
  if (cached && fs.existsSync(cacheFile)) {
    rendered = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
    stats.reused.push(entry.version);
  } else {
    rendered = renderVersion({ entry, tree, revision, assetKey, version, blogRoutes, checkoutDir: dir });
    stats.rendered.push(entry.version);
    if (cached) {
      fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify(rendered));
    }
  }
  return { ...entry, tree, revision, assetKey, declared, tokensVersion: version, ...rendered };
}

// --- The whole site ---------------------------------------------------------

export function buildContent() {
  const dir = contentRoot();
  const mode = process.env.SITE_MODE || "preview";
  const production = mode === "production";
  const content = identity(dir);
  const implementation = identity(root);
  const manifest = readManifest(dir);
  const cacheRoot = process.env.SITE_CACHE_DIR
    ? path.resolve(process.env.SITE_CACHE_DIR)
    : path.join(root, ".cache");
  const codeDigest = createHash("sha256")
    .update(String(CONTRACT))
    .update(fs.readFileSync(path.join(root, "scripts/contract.mjs")))
    .update(fs.readFileSync(path.join(root, "scripts/content.mjs")))
    .digest("hex")
    .slice(0, 12);
  const stats = { rendered: [], reused: [] };

  // Unversioned inputs: the landing page and the journal, from the checkout.
  const blogFiles = walk(path.join(dir, "engineering-docs/blog"))
    .filter((p) => p.endsWith(".md"))
    .map((p) => path.relative(dir, p));
  const blogRoutes = new Map(blogFiles.map((file) => [file, route(file)]));
  const versions = manifest.versions.map((entry) =>
    loadVersion(entry, { dir, content, cacheRoot, codeDigest, blogRoutes, stats }),
  );
  const current = versions.find((v) => v.version === manifest.current);
  for (const v of versions) v.byPath = new Map(v.pages.map((p) => [p.path, p]));
  const inCurrent = (pagePath) => current.byPath.has(pagePath);
  for (const role of ROLES)
    if (!current.roles[role])
      fail(`current version ${current.version} defines no page with role "${role}"; the landing page needs it`);
  const roles = Object.fromEntries(
    ROLES.map((role) => [role, docsUrl("current", docsPath(current.roles[role]))]),
  );
  const locate = (pagePath) => {
    if (inCurrent(pagePath)) return docsUrl("current", pagePath);
    const version = versions.find((v) => v.byPath.has(pagePath));
    return version ? docsUrl(version.version, pagePath) : undefined;
  };

  const assets = new Set();
  const hash = createHash("sha256");
  const unversionedContext = {
    revision: content.revision,
    assetKey: "main",
    assets,
    exists: (target) => fs.existsSync(path.join(dir, target)),
    local(target) {
      if (target === "README.md") return siteUrl("/");
      if (blogRoutes.has(target)) return siteUrl(blogRoutes.get(target));
      if (target.startsWith("docs/") && target.endsWith(".md")) {
        const url = locate(docsPath(target));
        if (!url) fail(`link to ${target}: no published documentation version contains that page`);
        return siteUrl(url);
      }
      return undefined;
    },
  };
  const readme = fs.readFileSync(path.join(dir, "README.md"), "utf8");
  hash.update("README.md\0" + readme + "\0");
  const home = render(readme, "README.md", unversionedContext);
  const rolePages = Object.fromEntries(ROLES.map((role) => [role, current.byPath.get(docsPath(current.roles[role]))]));
  const site = landing(home, roles, rolePages);
  const homeDescription = load(site.hero.lead, null, false).text().replace(/\s+/g, " ").trim() || home.description;
  const pages = [
    {
      ...home,
      file: "README.md",
      url: "/",
      kind: "home",
      description: excerpt(homeDescription),
      excerpt: excerpt(homeDescription),
      indexable: production,
      canonical: "/",
      sourceUrl: `${repository}/blob/${content.revision}/README.md`,
      landing: site,
    },
  ];
  if (site.why || site.comparison)
    pages.push({
      file: "README.md",
      url: "/why/",
      kind: "why",
      title: site.why?.heading || site.comparison.heading,
      titleId: "why",
      description: excerpt(load(site.why?.html || site.comparison.html, null, false)("p").first().text()),
      excerpt: excerpt(load(site.why?.html || site.comparison.html, null, false)("p").first().text()),
      indexable: production,
      canonical: "/why/",
      sourceUrl: `${repository}/blob/${content.revision}/README.md`,
      landing: site,
    });
  pages.push({
    file: "README.md",
    url: "/contribute/",
    kind: "contribute",
    title: site.contribute?.heading || "Contribute",
    titleId: "contribute",
    description: site.contribute
      ? excerpt(load(site.contribute.html, null, false)("p").first().text())
      : "How a stranger picks a bug, works it with an agent inside DevCapsule, and sends it back. Coming soon.",
    excerpt: "",
    planned: !site.contribute,
    noindex: !site.contribute,
    indexable: production && Boolean(site.contribute),
    canonical: "/contribute/",
    sourceUrl: `${repository}/blob/${content.revision}/README.md`,
    landing: site,
  });
  const posts = [];
  const aliases = new Map();
  for (const file of blogFiles) {
    if (file === "engineering-docs/blog/README.md") continue;
    const source = fs.readFileSync(path.join(dir, file), "utf8");
    hash.update(file + "\0" + source + "\0");
    const { meta, body } = readPage(source, file);
    if (meta.draft && production) continue;
    if (meta.role) fail(`${file}: "role" belongs to versioned documentation only`);
    const rendered = render(body, file, unversionedContext);
    const date = path.basename(file).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(`${file}: journal entries start with their YYYY-MM-DD date`);
    const post = {
      ...rendered,
      file,
      url: route(file),
      kind: "post",
      date,
      dateLabel: new Date(date + "T12:00:00Z").toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
      }),
      minutes: minutes(body),
      description: meta.description,
      excerpt: excerpt(meta.description),
      draft: meta.draft,
      updated: meta.updated,
      lastmod: meta.updated || date,
      historical: meta.status === "historical",
      indexable: production && !meta.draft,
      canonical: route(file),
      sourceUrl: `${repository}/blob/${content.revision}/${encodePath(file)}`,
    };
    // The journal moved from /blog/; the old address of every entry keeps working.
    for (const alias of [post.url.replace("/journal/", "/blog/"), ...meta.aliases])
      if (!aliases.has(alias)) aliases.set(alias, { url: post.url, title: post.title, from: file, priority: 0 });
    pages.push(post);
    posts.push(post);
  }
  posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

  // Versioned output: one directory per version, and the current copy.
  const versionAssets = {};
  for (const v of versions) {
    versionAssets[v.assetKey] = { tree: v.tree, files: v.assets };
    const isCurrent = v === current;
    v.summary = {
      version: v.version,
      label: v.version === "devel" ? `devel (${v.tokensVersion})` : v.version,
      status: v.status,
      note: v.note,
      current: isCurrent,
      revision: v.revision,
      source: v.source,
      tokensVersion: v.tokensVersion,
      url: docsUrl(isCurrent ? "current" : v.version, ""),
      versionUrl: docsUrl(v.version, ""),
    };
    const sidebarFor = (segment) => ({
      start: ROLES.filter((r) => v.roles[r]).map((r) => {
        const page = v.byPath.get(docsPath(v.roles[r]));
        return { title: page.title, url: docsUrl(segment, page.path), path: page.path, planned: page.planned };
      }),
      areas: v.areas.map((area) => ({
        title: area.title,
        pages: area.pages.map((p) => {
          const page = v.byPath.get(p);
          return { title: page.title, url: docsUrl(segment, p), path: p, planned: page.planned };
        }),
      })),
      background: v.pages
        .filter((p) => p.historical && !(p.draft && production))
        .map((p) => ({ title: p.title, url: docsUrl(segment, p.path), path: p.path })),
    });
    v.sidebar = { version: sidebarFor(v.version), current: sidebarFor("current") };
  }
  versionAssets.main = {
    tree: dir,
    files: [...new Set([...(versionAssets.main?.files ?? []), ...assets])].sort(),
  };
  for (const v of versions) {
    const isCurrent = v === current;
    const noindexVersion = v.status === "development" || v.status === "unsupported";
    for (const page of v.pages) {
      if (page.draft && production) continue;
      const copies = isCurrent ? ["current", v.version] : [v.version];
      for (const segment of copies) {
        const url = docsUrl(segment, page.path);
        const canonical =
          segment === "current" || !inCurrent(page.path) ? url : docsUrl("current", page.path);
        // Historical pages describe an earlier setup, so like planned stubs
        // and drafts they are served but not offered to search engines.
        const noindex = noindexVersion || page.planned || page.draft || page.historical;
        pages.push({
          ...page,
          html: page.html.replaceAll(SENTINEL, segment),
          url,
          kind: "doc",
          copy: segment === "current" ? "current" : "version",
          version: v.summary,
          canonical,
          currentUrl: inCurrent(page.path) ? docsUrl("current", page.path) : docsUrl("current", ""),
          noindex,
          indexable: production && !noindex && canonical === url,
          lastmod: page.updated,
          excerpt: excerpt(page.description),
          sidebar: v.sidebar[segment === "current" ? "current" : "version"],
          switcher: versions.map((w) => {
            const has = w.byPath.has(page.path);
            return {
              version: w.version,
              label: w.summary.label,
              status: w.status,
              url: docsUrl(w === current ? "current" : w.version, has ? page.path : ""),
              samePage: has,
              here: w === v,
              current: w === current,
            };
          }),
        });
      }
      // An old URL keeps working: it leads to the page in current when it is
      // there, otherwise to the newest listed version that declares it.
      const priority = isCurrent ? 0 : versions.indexOf(v) + 1;
      for (const alias of page.aliases) {
        const target = inCurrent(page.path) ? docsUrl("current", page.path) : docsUrl(v.version, page.path);
        const known = aliases.get(alias);
        if (!known || priority < known.priority)
          aliases.set(alias, { url: target, title: page.title, from: `${v.version}:${page.file}`, priority });
      }
    }
  }
  aliases.set("/blog/", { url: "/journal/", title: "The development journal", from: "the journal route", priority: 0 });
  const routes = new Set(pages.map((p) => p.url));
  routes.add("/docs/").add("/journal/");
  for (const [alias, target] of aliases) {
    const url = alias;
    if (routes.has(url))
      fail(`alias ${alias} (from ${target.from}) collides with a published page`);
    pages.push({
      kind: "alias",
      url,
      title: target.title,
      target: target.url,
      canonical: target.url,
      indexable: false,
      noindex: false,
    });
  }
  const urls = pages.map((p) => p.url);
  const duplicate = urls.find((u, i) => urls.indexOf(u) !== i);
  if (duplicate) fail(`two pages would publish at ${duplicate}`);

  for (const asset of [...assets].sort())
    hash.update(asset + "\0").update(fs.readFileSync(path.join(dir, asset)));
  hash.update("docs/versions.yaml\0" + fs.readFileSync(path.join(dir, "docs/versions.yaml"), "utf8") + "\0");
  for (const v of versions) {
    hash.update(`${v.version}\0${v.revision}\0${v.status}\0${v.note ?? ""}\0`);
    // A version read from the working tree is identified by its files, not
    // only by HEAD, so a dirty preview changes the digest as the contract asks.
    if (v.source === "main")
      for (const page of v.pages)
        hash.update(page.file + "\0").update(fs.readFileSync(path.join(dir, page.file))).update("\0");
  }
  const groups = {
    supported: versions.filter((v) => ["supported", "deprecated"].includes(v.status)).map((v) => v.summary),
    unsupported: versions.filter((v) => v.status === "unsupported").map((v) => v.summary),
    development: versions.filter((v) => v.status === "development").map((v) => v.summary),
  };
  let notice = "";
  if (manifest.notice) {
    const $ = load(new MarkdownIt({ linkify: true }).render(manifest.notice), null, false);
    $("a[href]").each((_, el) =>
      $(el).attr("href", resolveTarget($(el).attr("href"), "docs/versions.yaml", unversionedContext)),
    );
    notice = $.html();
  }
  const buildManifest = {
    schema: 1,
    builtAt: new Date().toISOString(),
    content: { ...content, sha256: hash.digest("hex") },
    implementation,
    basePath: prefix(),
    mode,
    contract: CONTRACT,
    current: manifest.current,
    versions: versions.map((v) => ({
      version: v.version, status: v.status, source: v.source, revision: v.revision,
    })),
    pages: pages.map((p) => ({ file: p.file ?? null, url: p.url })),
  };
  return {
    pages,
    posts,
    landing: site,
    versions: versions.map((v) => v.summary),
    groups,
    current: current.summary,
    notice,
    roles,
    assets: [...assets],
    versionAssets,
    manifest: buildManifest,
    sitemap: sitemapEntries(
      [
        { url: "/journal/", lastmod: posts[0]?.lastmod, indexable: production },
        { url: "/docs/", indexable: production },
        ...pages,
      ],
      mode,
    ),
    stats,
    contentDir: dir,
  };
}

// Only pages a search engine may index belong in the sitemap: production
// builds only, no drafts, no noindex versions, no page whose canonical URL is
// another page, and no alias.
export function sitemapEntries(pages, mode) {
  if (mode !== "production") return [];
  return pages
    .filter((p) => p.indexable)
    .map((p) => ({ loc: siteUrl(p.url), lastmod: p.lastmod || null }));
}
