// The content–website contract, version 1, as this consumer implements it.
// CONTRACT.md records the accepted interface; this module is its executable
// half: manifest, front matter, version tokens, source resolution and the
// once-only extraction of immutable sources. Every failure names the file,
// field, version or role that caused it.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parse as parseYaml } from "yaml";

export const CONTRACT = 1;
export const repository = "https://github.com/ccozianu/devcapsule";
export const ROLES = [
  "overview",
  "getting-started",
  "your-project",
  "agents",
  "containment",
  "windows",
];
export const VERSION_STATUSES = [
  "development",
  "supported",
  "deprecated",
  "unsupported",
];
export const PAGE_STATUSES = ["current", "historical", "planned"];
const PAGE_KEYS = [
  "description",
  "draft",
  "status",
  "aliases",
  "weight",
  "updated",
  "role",
];
const MANIFEST_KEYS = ["contract", "current", "notice", "versions"];
const ENTRY_KEYS = [
  "version",
  "source",
  "status",
  "note",
  "source-version",
  "legacy",
];
export const RELEASE_VERSION = /^\d+\.\d+\.\d+$/;
export const DEV_VERSION = /^\d+\.\d+\.\d+\.dev\d+$/;
// A DevCapsule version typed into a versioned page, per the contract, with
// boundaries so that addresses such as 127.0.0.1 are not versions.
export const TYPED_VERSION = /(?<![\w.])v?0\.\d+\.\d+(?:\.dev\d+)?(?!\w|\.\d)/g;
const TOKEN = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;
export const TOKENS = ["version", "tag", "release_url", "download_url"];

export class ContractError extends Error {}
const fail = (message) => {
  throw new ContractError(message);
};

// --- Front matter ---------------------------------------------------------

export function splitFrontMatter(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;
  let data;
  try {
    data = parseYaml(match[1]);
  } catch (error) {
    fail(`${file}: front matter is not valid YAML: ${error.message}`);
  }
  if (data === null || typeof data !== "object" || Array.isArray(data))
    fail(`${file}: front matter must be a mapping`);
  const bodyOffset = match[0].split("\n").length - 1;
  return { data, body: source.slice(match[0].length), bodyOffset };
}

export function validatePage(data, file, { legacy = false } = {}) {
  for (const key of Object.keys(data))
    if (!PAGE_KEYS.includes(key)) fail(`${file}: unknown front matter key "${key}"`);
  const page = {
    description: data.description,
    draft: data.draft ?? false,
    status: data.status ?? "current",
    aliases: data.aliases ?? [],
    weight: data.weight ?? null,
    updated: data.updated ?? null,
    role: data.role ?? null,
  };
  if (typeof page.description !== "string" || !page.description.trim())
    fail(`${file}: front matter needs a "description"`);
  if (page.description.length > 200)
    fail(`${file}: "description" exceeds 200 characters`);
  if (typeof page.draft !== "boolean") fail(`${file}: "draft" must be true or false`);
  if (!PAGE_STATUSES.includes(page.status))
    fail(`${file}: "status" must be one of ${PAGE_STATUSES.join(", ")}`);
  if (!Array.isArray(page.aliases) || !page.aliases.every((a) => typeof a === "string"))
    fail(`${file}: "aliases" must be a list of site-relative paths`);
  for (const alias of page.aliases)
    if (!/^\/(?:[A-Za-z0-9._-]+\/)*$/.test(alias))
      fail(`${file}: alias "${alias}" must be a site-relative directory path such as /docs/guides/first-session/`);
  if (page.weight !== null && !Number.isInteger(page.weight))
    fail(`${file}: "weight" must be an integer`);
  if (page.updated !== null) {
    const text =
      page.updated instanceof Date ? page.updated.toISOString().slice(0, 10) : String(page.updated);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) fail(`${file}: "updated" must be YYYY-MM-DD`);
    page.updated = text;
  }
  if (page.role !== null && !ROLES.includes(page.role))
    fail(`${file}: "role" must be one of ${ROLES.join(", ")}`);
  void legacy;
  return page;
}

// Reads a page's front matter. Outside legacy trees a missing block fails;
// in a legacy tree (a source that predates the contract) a page without a
// block gets the defaults and its description from the rendered prose.
export function readPage(source, file, { legacy = false, required = true } = {}) {
  const split = splitFrontMatter(source, file);
  if (!split) {
    if (required && !legacy) fail(`${file}: missing front matter block`);
    return {
      meta: {
        description: null,
        draft: false,
        status: "current",
        aliases: [],
        weight: null,
        updated: null,
        role: null,
      },
      body: source,
      bodyOffset: 0,
      declared: false,
    };
  }
  return {
    meta: validatePage(split.data, file, { legacy }),
    body: split.body,
    bodyOffset: split.bodyOffset,
    declared: true,
  };
}

// --- Tokens and typed versions -------------------------------------------

export function tokenValues(version) {
  return {
    version,
    tag: "v" + version,
    release_url: `${repository}/releases/tag/v${version}`,
    download_url: `${repository}/releases/download/v${version}`,
  };
}

export function checkTypedVersions(body, file, bodyOffset = 0) {
  body.split("\n").forEach((line, i) => {
    const typed = line.match(TYPED_VERSION);
    if (typed)
      fail(
        `${file}:${i + 1 + bodyOffset}: typed version "${typed[0]}"; write {{version}} or {{tag}} instead`,
      );
  });
}

export function renderTokens(body, file, values, bodyOffset = 0) {
  return body.replace(TOKEN, (match, name, offset) => {
    if (name in values) return values[name];
    const line = body.slice(0, offset).split("\n").length + bodyOffset;
    return fail(`${file}:${line}: unknown token ${match}; the contract defines ${TOKENS.map((t) => `{{${t}}}`).join(", ")}`);
  });
}

// --- Manifest -------------------------------------------------------------

export function parseManifest(text, file = "docs/versions.yaml") {
  let data;
  try {
    data = parseYaml(text);
  } catch (error) {
    fail(`${file}: not valid YAML: ${error.message}`);
  }
  if (!data || typeof data !== "object" || Array.isArray(data))
    fail(`${file}: must be a mapping`);
  for (const key of Object.keys(data))
    if (!MANIFEST_KEYS.includes(key)) fail(`${file}: unknown key "${key}"`);
  if (data.contract !== CONTRACT)
    fail(
      `${file}: written to contract ${JSON.stringify(data.contract ?? null)}; this website implements contract ${CONTRACT}`,
    );
  if (data.notice !== undefined && typeof data.notice !== "string")
    fail(`${file}: "notice" must be a Markdown paragraph`);
  if (!Array.isArray(data.versions) || data.versions.length === 0)
    fail(`${file}: "versions" must list at least one version`);
  const versions = data.versions.map((entry, i) => {
    const where = `${file}: versions[${i}]`;
    if (!entry || typeof entry !== "object") fail(`${where}: must be a mapping`);
    for (const key of Object.keys(entry))
      if (!ENTRY_KEYS.includes(key)) fail(`${where}: unknown key "${key}"`);
    const version = String(entry.version ?? "");
    if (version !== "devel" && !RELEASE_VERSION.test(version))
      fail(`${where}: "version" must be devel or X.Y.Z, not "${version}"`);
    if (typeof entry.source !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_./-]*$/.test(entry.source))
      fail(`${where} (${version}): "source" must be a Git ref`);
    if (!VERSION_STATUSES.includes(entry.status))
      fail(`${where} (${version}): "status" must be one of ${VERSION_STATUSES.join(", ")}`);
    if (entry.note !== undefined && typeof entry.note !== "string")
      fail(`${where} (${version}): "note" must be one sentence`);
    if (entry["source-version"] !== undefined && typeof entry["source-version"] !== "string")
      fail(`${where} (${version}): "source-version" must be a version string`);
    if (entry.legacy !== undefined && typeof entry.legacy !== "boolean")
      fail(`${where} (${version}): "legacy" must be true or false`);
    return {
      version,
      source: entry.source,
      status: entry.status,
      note: entry.note ?? null,
      sourceVersion: entry["source-version"] ?? null,
      legacy: entry.legacy ?? false,
    };
  });
  const names = versions.map((v) => v.version);
  const duplicate = names.find((name, i) => names.indexOf(name) !== i);
  if (duplicate) fail(`${file}: version "${duplicate}" is listed twice`);
  const current = String(data.current ?? "");
  if (!names.includes(current))
    fail(`${file}: "current" must name a listed version, not "${current}"`);
  return { contract: CONTRACT, current, notice: data.notice ?? null, versions };
}

export function readManifest(dir) {
  const file = path.join(dir, "docs/versions.yaml");
  if (!fs.existsSync(file))
    fail(`docs/versions.yaml: missing; the content checkout does not declare its documentation versions (contract ${CONTRACT})`);
  return parseManifest(fs.readFileSync(file, "utf8"));
}

// --- Sources --------------------------------------------------------------

const git = (dir, args, options = {}) =>
  execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", ...options }).trim();

export function declaredVersion(pyproject, where) {
  const project = pyproject.split(/^\[/m).find((s) => s.startsWith("project]"));
  const match = project && project.match(/^version\s*=\s*"([^"]+)"/m);
  if (!match) fail(`${where}: devcapsule-src/pyproject.toml declares no [project] version`);
  return match[1];
}

// Checks the version a source declares against its manifest entry (4.2) and
// returns the version the tokens render: the entry's release version, or the
// declared development version for devel.
export function checkDeclaredVersion(entry, declared) {
  const where = `version ${entry.version} (source ${entry.source})`;
  if (entry.version === "devel") {
    if (DEV_VERSION.test(declared) || entry.sourceVersion === declared) return declared;
    fail(`${where}: the source declares release version ${declared}; devel needs a development version, or source-version: "${declared}"`);
  }
  if (declared === entry.version || entry.sourceVersion === declared) return entry.version;
  fail(`${where}: the source declares version ${declared}, not ${entry.version}; add source-version: "${declared}" if this is intended`);
}

export function resolveSource(dir, source) {
  for (const ref of [source, `origin/${source}`]) {
    try {
      return git(dir, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], { stdio: ["ignore", "pipe", "ignore"] });
    } catch {
      /* try the next spelling */
    }
  }
  return null;
}

// Extracts docs/ and the version file of an immutable source once, keyed by
// its commit, so a released version is never re-read from Git.
export function extractSource(dir, revision, cacheRoot) {
  const target = path.join(cacheRoot, "content", revision);
  if (fs.existsSync(path.join(target, ".complete"))) return target;
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  for (const item of ["docs", "devcapsule-src/pyproject.toml"]) {
    try {
      git(dir, ["cat-file", "-e", `${revision}:${item}`], { stdio: ["ignore", "pipe", "ignore"] });
    } catch {
      fs.rmSync(target, { recursive: true, force: true });
      fail(`source ${revision.slice(0, 7)}: no ${item} at that revision`);
    }
    const archive = execFileSync("git", ["-C", dir, "archive", "--format=tar", revision, item], {
      maxBuffer: 1 << 30,
    });
    execFileSync("tar", ["-x", "-C", target], { input: archive });
  }
  fs.writeFileSync(path.join(target, ".complete"), revision);
  return target;
}

export function fileExistsAt(dir, revision, file) {
  try {
    git(dir, ["cat-file", "-e", `${revision}:${file}`], { stdio: ["ignore", "pipe", "ignore"] });
    return true;
  } catch {
    return false;
  }
}
