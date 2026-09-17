import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const testOrigin = "https://test-devcapsule.mycodespace.ai";
const productionOrigin = "https://devcapsule.mycodespace.ai";

// Keep the rendered bytes intact except for each page's canonical hostname.
// Reject unexpected metadata rather than guessing how to migrate a new format.
export function promote(directory, candidate) {
  const infoPath = path.join(directory, "build-info.json");
  const info = JSON.parse(fs.readFileSync(infoPath, "utf8"));
  assert.equal(info.schema, 1, "Unsupported build manifest");
  assert.equal(info.mode, "production", "Candidate must be a deployed production-mode build");
  assert.equal(info.basePath, "/", "Candidate must use the custom-domain root");
  for (const [identity, revision] of [
    [info.content, candidate.contentSha],
    [info.implementation, candidate.websiteSha],
  ]) {
    assert.match(revision, /^[a-f0-9]{40}$/);
    assert.equal(identity.revision, revision, "Candidate source revision mismatch");
    assert.equal(identity.dirty, false, "Candidate must have clean sources");
  }
  assert.match(info.content.sha256, /^[a-f0-9]{64}$/);
  assert.match(candidate.runId, /^[1-9][0-9]*$/);
  assert.match(candidate.artifactId, /^[1-9][0-9]*$/);
  assert.match(candidate.digest, /^sha256:[a-f0-9]{64}$/);
  assert.equal(fs.readFileSync(path.join(directory, "robots.txt"), "utf8").trim(),
    "User-agent: *\nAllow: /", "Unexpected indexing policy");

  const changes = [];
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      assert(entry.isDirectory() || entry.isFile(), "Unsupported artifact entry");
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith(".html")) {
        const html = fs.readFileSync(file, "utf8");
        const canonical = [...html.matchAll(/<link rel="canonical" href="([^"]+)">/g)];
        assert.equal(canonical.length, 1, `Expected one canonical URL in ${file}`);
        assert(canonical[0][1].startsWith(testOrigin + "/"), `Unexpected canonical origin in ${file}`);
        assert(!/<meta\b[^>]*name=["']robots["']/i.test(html), "Unexpected page indexing override");
        changes.push([file, html.replace(canonical[0][0], canonical[0][0].replace(testOrigin, productionOrigin))]);
      }
    }
  }
  visit(directory);
  assert(changes.length > 0, "Candidate contains no HTML pages");
  assert(fs.existsSync(path.join(directory, "index.html")), "Missing homepage");
  // Validate every file before writing any changes.
  for (const [file, html] of changes) fs.writeFileSync(file, html);
  info.promotion = {
    sourceRun: `https://github.com/ccozianu/devcapsule/actions/runs/${candidate.runId}`,
    artifactId: candidate.artifactId,
    artifactDigest: candidate.digest,
    origin: productionOrigin,
    transformation: "canonical-origin-only",
  };
  fs.writeFileSync(infoPath, JSON.stringify(info, null, 2) + "\n");
  return changes.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const count = promote(path.resolve("_site"), {
    contentSha: process.env.CANDIDATE_CONTENT_SHA,
    websiteSha: process.env.CANDIDATE_WEBSITE_SHA,
    runId: process.env.CANDIDATE_RUN_ID,
    artifactId: process.env.CANDIDATE_ARTIFACT_ID,
    digest: process.env.CANDIDATE_DIGEST,
  });
  console.log(`Prepared ${count} pages for ${productionOrigin}; no content or assets rebuilt.`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      `Promoting test run ${process.env.CANDIDATE_RUN_ID} to ${productionOrigin}.\n\n` +
      `Content: \`${process.env.CANDIDATE_CONTENT_SHA}\`\n\n` +
      `Website: \`${process.env.CANDIDATE_WEBSITE_SHA}\`\n\n` +
      "Only canonical origins and promotion provenance change.\n");
  }
}
