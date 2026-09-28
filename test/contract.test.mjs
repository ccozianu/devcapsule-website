// Contract version 1 acceptance against the shared fixture: what the build
// serves, how every named failure is reported, and that immutable versions
// are built once. CONTRACT.md section "Acceptance" lists these.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildContent } from "../scripts/content.mjs";
import { createFixtureRepo } from "./fixture-repo.mjs";

function withEnv(values, fn) {
  const saved = {};
  for (const [key, value] of Object.entries(values)) {
    saved[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(saved))
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
  }
}
const build = (repo, mode = "production") =>
  withEnv(
    { CONTENT_DIR: repo.dir, SITE_CACHE_DIR: repo.cache, SITE_MODE: mode, SITE_BASE_PATH: undefined, SITE_ORIGIN: undefined },
    buildContent,
  );
const page = (site, url) => site.pages.find((p) => p.url === url);

test("the fixture builds every version, the current copy, the index data, roles and aliases", (t) => {
  const repo = createFixtureRepo();
  t.after(repo.remove);
  const site = build(repo);
  assert.deepEqual(site.versions.map((v) => v.version), ["devel", "1.0.0", "0.9.0"]);
  assert.equal(site.current.version, "1.0.0");
  assert.equal(site.current.url, "/docs/current/");
  assert.deepEqual(site.groups.supported.map((v) => v.version), ["1.0.0", "0.9.0"]);
  assert.deepEqual(site.groups.development.map((v) => v.version), ["devel"]);
  assert.match(site.notice, /Fixture notice/);
  assert.match(site.notice, /href="\/blog\/"/);
  assert.deepEqual(site.roles, {
    overview: "/docs/current/",
    "getting-started": "/docs/current/getting-started/first-session/",
    "your-project": "/docs/current/your-project/existing-repository/",
    agents: "/docs/current/working-with-ai/choose-an-agent/",
    containment: "/docs/current/containment/the-boundary/",
    windows: "/docs/current/platforms/windows-wsl2/",
  });
  for (const url of ["/docs/current/", "/docs/1.0.0/", "/docs/devel/", "/docs/0.9.0/", "/docs/0.9.0/guides/first-session/"])
    assert.ok(page(site, url), url);

  // Tokens render the entry's release version, and devel's declared version.
  const current = page(site, "/docs/current/getting-started/first-session/");
  assert.match(current.html, /Download v1\.0\.0 from <a href="https:\/\/github.com\/ccozianu\/devcapsule\/releases\/tag\/v1\.0\.0">/);
  assert.match(current.html, /releases\/download\/v1\.0\.0\/fixture/);
  assert.match(page(site, "/docs/devel/").html, /Version 1\.1\.0\.dev0/);
  assert.match(page(site, "/docs/current/").html, /Version 1\.0\.0/);

  // Links stay inside the copy they are read in, and outside docs/ become permalinks at the source.
  assert.match(current.html, /href="\/docs\/current\/platforms\/windows-wsl2\/#before-you-start"/);
  assert.match(current.html, /href="\/docs\/current\/"/);
  assert.match(page(site, "/docs/1.0.0/getting-started/first-session/").html, /href="\/docs\/1\.0\.0\/platforms\/windows-wsl2\/#before-you-start"/);
  assert.match(current.html, /href="\/"/);
  const releaseSha = repo.git("rev-parse", "v1.0.0");
  assert.match(current.html, new RegExp(`href="https://github.com/ccozianu/devcapsule/blob/${releaseSha}/DEVELOPING.md"`));
  assert.match(page(site, "/docs/current/").html, /src="\/content-assets\/[0-9a-f]{7}\/docs\/images\/diagram.svg"/);
  assert.match(page(site, "/docs/devel/").html, /src="\/content-assets\/main\/docs\/images\/diagram.svg"/);

  // Canonicals, robots and the sitemap follow the status.
  assert.equal(current.canonical, "/docs/current/getting-started/first-session/");
  assert.equal(current.indexable, true);
  const versioned = page(site, "/docs/1.0.0/getting-started/first-session/");
  assert.equal(versioned.canonical, "/docs/current/getting-started/first-session/");
  assert.equal(versioned.indexable, false);
  const devel = page(site, "/docs/devel/getting-started/first-session/");
  assert.equal(devel.canonical, "/docs/current/getting-started/first-session/");
  assert.equal(devel.noindex, true);
  const onlyInDevel = page(site, "/docs/devel/getting-started/new-in-devel/");
  assert.equal(onlyInDevel.canonical, "/docs/devel/getting-started/new-in-devel/");
  assert.equal(onlyInDevel.noindex, true);
  const deprecated = page(site, "/docs/0.9.0/guides/first-session/");
  assert.equal(deprecated.canonical, "/docs/0.9.0/guides/first-session/");
  assert.equal(deprecated.indexable, true);
  assert.equal(deprecated.noindex, false);
  assert.match(deprecated.html, /v0\.9\.0/);
  assert.equal(page(site, "/docs/0.9.0/product/pitch/").historical, true);
  const locations = site.sitemap.map((e) => e.loc);
  assert.ok(locations.includes("/docs/current/getting-started/first-session/"));
  assert.ok(locations.includes("/docs/0.9.0/guides/first-session/"));
  assert.ok(!locations.includes("/docs/1.0.0/getting-started/first-session/"));
  assert.ok(!locations.includes("/docs/devel/"));
  assert.ok(!locations.includes("/docs/current/reference/cli/"), "planned stubs are not indexable");
  assert.ok(locations.includes("/blog/2026-01-02-fixture-entry/"));

  // The switcher: the same page where it exists, otherwise that version's index.
  assert.deepEqual(
    current.switcher.map((v) => [v.version, v.url, v.samePage, v.here]),
    [
      ["devel", "/docs/devel/getting-started/first-session/", true, false],
      ["1.0.0", "/docs/current/getting-started/first-session/", true, true],
      ["0.9.0", "/docs/0.9.0/", false, false],
    ],
  );
  assert.deepEqual(
    onlyInDevel.switcher.map((v) => [v.version, v.url]),
    [["devel", "/docs/devel/getting-started/new-in-devel/"], ["1.0.0", "/docs/current/"], ["0.9.0", "/docs/0.9.0/"]],
  );

  // Planned stubs, sidebar order from the overview and its weights, and the
  // journal's description and aliases.
  assert.equal(page(site, "/docs/devel/reference/cli/").planned, true);
  assert.equal(page(site, "/docs/devel/reference/cli/").noindex, true);
  const sidebar = page(site, "/docs/devel/").sidebar;
  assert.deepEqual(sidebar.areas.map((a) => a.title), ["Getting started", "Your project", "Working with AI", "Containment", "Platforms", "Reference"]);
  assert.deepEqual(sidebar.areas[4].pages.map((p) => p.path), ["platforms/linux/", "platforms/windows-wsl2/"]);
  assert.deepEqual(sidebar.start.map((p) => p.path), ["", "getting-started/first-session/", "your-project/existing-repository/", "working-with-ai/choose-an-agent/", "containment/the-boundary/", "platforms/windows-wsl2/"]);
  assert.deepEqual(sidebar.background.map((p) => p.path), ["product/pitch/"]);
  assert.deepEqual(page(site, "/docs/0.9.0/").sidebar.areas.map((a) => a.title), ["Guides"]);
  const post = page(site, "/blog/2026-01-02-fixture-entry/");
  assert.equal(post.description, "A fixture journal entry that links a versioned guide and names a version, which unversioned pages may do.");
  assert.match(post.html, /href="\/docs\/current\/getting-started\/first-session\/"/);
  assert.equal(post.lastmod, "2026-01-03");
  const aliases = site.pages.filter((p) => p.kind === "alias").map((p) => [p.url, p.target]);
  assert.deepEqual(aliases.sort(), [
    ["/blog/old-entry/", "/blog/2026-01-02-fixture-entry/"],
    ["/docs/guides/first-session/", "/docs/current/getting-started/first-session/"],
    ["/docs/old-first-session/", "/docs/current/getting-started/first-session/"],
  ]);
  assert.equal(site.manifest.contract, 1);
  assert.equal(site.manifest.current, "1.0.0");
  assert.equal(site.manifest.versions[1].revision, releaseSha);
});

test("drafts are absent from production builds and labelled in previews", (t) => {
  const repo = createFixtureRepo();
  t.after(repo.remove);
  const production = build(repo);
  assert.equal(page(production, "/docs/devel/getting-started/draft-page/"), undefined);
  assert.equal(page(production, "/blog/2026-01-01-draft-entry/"), undefined);
  const preview = build(repo, "preview");
  assert.equal(page(preview, "/docs/devel/getting-started/draft-page/").draft, true);
  assert.equal(page(preview, "/blog/2026-01-01-draft-entry/").draft, true);
  assert.deepEqual(preview.sitemap, []);
});

test("each named failure names its file, field, version or role", (t) => {
  const cases = [
    ["missing manifest", (r) => r.git("rm", "-q", "docs/versions.yaml"), /docs\/versions\.yaml: missing/],
    ["unknown contract", (r) => r.write("docs/versions.yaml", r.read("docs/versions.yaml").replace("contract: 1", "contract: 2")), /written to contract 2; this website implements contract 1/],
    ["unknown manifest key", (r) => r.write("docs/versions.yaml", r.read("docs/versions.yaml") + "extra: true\n"), /unknown key "extra"/],
    ["unknown entry key", (r) => r.write("docs/versions.yaml", r.read("docs/versions.yaml").replace("status: supported", "status: supported\n    flavour: x")), /versions\[1\]: unknown key "flavour"/],
    ["current not listed", (r) => r.write("docs/versions.yaml", r.read("docs/versions.yaml").replace('current: "1.0.0"', 'current: "2.0.0"')), /"current" must name a listed version, not "2.0.0"/],
    ["invalid status", (r) => r.write("docs/versions.yaml", r.read("docs/versions.yaml").replace("status: deprecated", "status: retired")), /\(0\.9\.0\): "status" must be one of/],
    ["unresolvable source", (r) => r.write("docs/versions.yaml", r.read("docs/versions.yaml").replace("source: v1.0.0", "source: v9.9.9")), /version 1\.0\.0: source "v9\.9\.9" does not resolve/],
    ["version mismatch", (r) => r.write("docs/versions.yaml", r.read("docs/versions.yaml").replace("source: v1.0.0", "source: v0.9.0")), /version 1\.0\.0 \(source v0\.9\.0\): the source declares version 0\.9\.0, not 1\.0\.0/],
    ["devel at a release version", (r) => r.write("devcapsule-src/pyproject.toml", r.read("devcapsule-src/pyproject.toml").replace("1.1.0.dev0", "1.1.0")), /version devel \(source main\): the source declares release version 1\.1\.0/],
    ["missing front matter", (r) => r.write("docs/platforms/linux.md", "# Linux\n\nText.\n"), /docs\/platforms\/linux\.md: missing front matter block/],
    ["missing description", (r) => r.write("docs/platforms/linux.md", "---\nweight: 1\n---\n# Linux\n"), /docs\/platforms\/linux\.md: front matter needs a "description"/],
    ["unknown front matter key", (r) => r.write("docs/platforms/linux.md", "---\ndescription: x\ntitle: Linux\n---\n# Linux\n"), /docs\/platforms\/linux\.md: unknown front matter key "title"/],
    ["invalid status value", (r) => r.write("docs/platforms/linux.md", "---\ndescription: x\nstatus: draft\n---\n# Linux\n"), /docs\/platforms\/linux\.md: "status" must be one of current, historical, planned/],
    ["typed version", (r) => r.write("docs/platforms/linux.md", "---\ndescription: x\n---\n# Linux\n\nUse v0.9.0 here.\n"), /docs\/platforms\/linux\.md:6: typed version "v0\.9\.0"/],
    ["typed development version", (r) => r.write("docs/platforms/linux.md", "---\ndescription: x\n---\n# Linux\n\nUse 0.2.16.dev0.\n"), /typed version "0\.2\.16\.dev0"/],
    ["unknown token", (r) => r.write("docs/platforms/linux.md", "---\ndescription: x\n---\n# Linux\n\n{{versoin}}\n"), /docs\/platforms\/linux\.md:6: unknown token \{\{versoin\}\}/],
    ["duplicate role", (r) => r.write("docs/platforms/linux.md", "---\ndescription: x\nrole: windows\n---\n# Linux\n"), /version devel: role "windows" is declared by both/],
    ["missing required role", (r) => r.write("docs/versions.yaml", r.read("docs/versions.yaml").replace('current: "1.0.0"', 'current: "0.9.0"')), /current version 0\.9\.0 defines no page with role "overview"/],
    ["alias collision", (r) => r.write("docs/platforms/linux.md", "---\ndescription: x\naliases: [/docs/current/]\n---\n# Linux\n"), /alias \/docs\/current\/ .* collides with a published page/],
    ["broken link", (r) => r.write("docs/platforms/linux.md", "---\ndescription: x\n---\n# Linux\n\n[gone](nowhere.md)\n"), /docs\/platforms\/linux\.md: broken source link nowhere\.md/],
    ["journal without front matter", (r) => r.write("engineering-docs/blog/2026-01-04-bare.md", "# Bare\n\nText.\n"), /engineering-docs\/blog\/2026-01-04-bare\.md: missing front matter block/],
    ["documentation link nowhere", (r) => r.write("engineering-docs/blog/2026-01-04-link.md", "---\ndescription: x\n---\n# Link\n\n[gone](../../docs/missing.md)\n"), /link to docs\/missing\.md: no published documentation version contains that page/],
  ];
  for (const [name, mutate, expected] of cases) {
    const repo = createFixtureRepo();
    try {
      mutate(repo);
      assert.throws(() => build(repo), expected, name);
    } finally {
      repo.remove();
    }
  }
});

test("immutable versions are built once; a change on main rebuilds only devel", (t) => {
  const repo = createFixtureRepo();
  t.after(repo.remove);
  const first = build(repo);
  assert.deepEqual(first.stats, { rendered: ["devel", "1.0.0", "0.9.0"], reused: [] });
  repo.write("docs/platforms/linux.md", repo.read("docs/platforms/linux.md") + "\nA new paragraph.\n");
  const second = build(repo);
  assert.deepEqual(second.stats, { rendered: ["devel"], reused: ["1.0.0", "0.9.0"] });
  assert.match(page(second, "/docs/devel/platforms/linux/").html, /A new paragraph/);
  assert.notEqual(second.manifest.content.sha256, first.manifest.content.sha256);
  // A manifest change re-assembles without re-rendering a version whose source is unchanged.
  repo.write("docs/versions.yaml", repo.read("docs/versions.yaml").replace("status: deprecated", "status: unsupported"));
  const third = build(repo);
  assert.deepEqual(third.stats, { rendered: ["devel"], reused: ["1.0.0", "0.9.0"] });
  assert.deepEqual(third.groups.unsupported.map((v) => v.version), ["0.9.0"]);
  assert.equal(page(third, "/docs/0.9.0/guides/first-session/").noindex, true);
});
