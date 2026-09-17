import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { promote } from "./promote.mjs";

const repository = "https://github.com/ccozianu/devcapsule";
const digest = bytes => "sha256:" + createHash("sha256").update(bytes).digest("hex");
export function validateCandidate(candidate, tag) {
  assert.match(tag, /^website-candidate-[1-9][0-9]*-[1-9][0-9]*$/);
  assert.equal(candidate.schema, 1);
  assert.equal(candidate.tag, tag);
  assert.equal(tag, `website-candidate-${candidate.runId}-${candidate.runAttempt}`);
  assert.match(candidate.contentSha, /^[a-f0-9]{40}$/);
  assert.match(candidate.websiteSha, /^[a-f0-9]{40}$/);
  assert.match(candidate.digest, /^sha256:[a-f0-9]{64}$/);
  return candidate;
}

function safeName(name) {
  assert(/^[A-Za-z0-9_./-]+$/.test(name) && !name.startsWith("/") &&
    !name.split("/").includes(".."), `Unsupported archive path: ${name}`);
}
function validateFiles(dir, prefix = "") {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = prefix + entry.name;
    safeName(name);
    assert(entry.isFile() || entry.isDirectory(), "Candidate cannot contain symbolic links or special files");
    if (entry.isDirectory()) validateFiles(path.join(dir, entry.name), name + "/");
  }
}

export function pack(directory, bundle, source) {
  const info = JSON.parse(fs.readFileSync(path.join(directory, "build-info.json")));
  assert.equal(info.content.revision, source.contentSha);
  assert.equal(info.implementation.revision, source.websiteSha);
  assert.equal(info.content.dirty, false);
  assert.equal(info.implementation.dirty, false);
  assert.equal(info.mode, "production");
  assert.equal(info.basePath, "/");
  validateFiles(directory);
  fs.mkdirSync(bundle); // Refuse to replace an existing candidate bundle.
  const archive = path.join(bundle, "website.tar.gz");
  execFileSync("tar", ["-czf", archive, "--format=ustar", "-C", directory, "."]);
  const candidate = validateCandidate({ schema: 1, ...source,
    digest: digest(fs.readFileSync(archive)) }, source.tag);
  // Exercise metadata validation on a disposable copy; preserve the tested bytes.
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "candidate-validate-"));
  try {
    fs.cpSync(directory, temporary, { recursive: true });
    promote(temporary, candidate);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
  fs.writeFileSync(path.join(bundle, "candidate.json"), JSON.stringify(candidate, null, 2) + "\n");
  fs.writeFileSync(path.join(bundle, "release-notes.txt"),
    `Website candidate from a successful test deployment; not a CLI release.\n\n` +
    `Test run: ${repository}/actions/runs/${source.runId}/attempts/${source.runAttempt}\n\n` +
    `Content: ${source.contentSha}\nWebsite: ${source.websiteSha}\n\n` +
    `SHA-256 (website.tar.gz): ${candidate.digest.slice(7)}\n\n` +
    `Review https://test-devcapsule.mycodespace.ai, then select ${source.tag} in the production workflow.\n`);
  return candidate;
}

export function unpack(archive, directory, candidate) {
  assert.equal(digest(fs.readFileSync(archive)), candidate.digest, "Candidate archive checksum mismatch");
  // GNU tar is available on the Ubuntu Actions runner. Validate paths and entry
  // types before extraction; reject links, devices, traversal and duplicate names.
  const names = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" }).trim().split("\n");
  names.forEach(safeName);
  assert.equal(new Set(names.map(name => path.posix.normalize(name))).size, names.length,
    "Duplicate archive paths");
  const entries = execFileSync("tar", ["-tvzf", archive], { encoding: "utf8" }).trim().split("\n");
  assert.equal(entries.length, names.length);
  assert(entries.every(line => /^[d-]/.test(line)), "Archive must contain only ordinary files and directories");
  fs.mkdirSync(directory); // Do not merge with old or unchecked output.
  execFileSync("tar", ["-xzf", archive, "-C", directory, "--no-same-owner", "--no-same-permissions"]);
}

export async function download(tag, directory, request = fetch) {
  assert.match(tag, /^website-candidate-[1-9][0-9]*-[1-9][0-9]*$/);
  const base = `${repository}/releases/download/${tag}/`;
  async function get(name) {
    // Public release URLs; no Authorization header or personal token.
    const response = await request(base + name);
    assert(response.ok, `Public candidate download failed (${response.status}): ${name}`);
    return response;
  }
  const candidate = validateCandidate(await (await get("candidate.json")).json(), tag);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "candidate-download-"));
  try {
    const archive = path.join(temporary, "website.tar.gz");
    fs.writeFileSync(archive, Buffer.from(await (await get("website.tar.gz")).arrayBuffer()));
    unpack(archive, directory, candidate);
    promote(directory, candidate);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
  return candidate;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const tag = process.env.CANDIDATE_TAG;
  let candidate;
  if (process.argv[2] === "pack") {
    candidate = pack(path.resolve("candidate-site"), path.resolve("candidate-bundle"), {
      tag, runId: process.env.GITHUB_RUN_ID, runAttempt: process.env.GITHUB_RUN_ATTEMPT,
      contentSha: process.env.GITHUB_SHA,
      websiteSha: execFileSync("git", ["rev-parse", "HEAD:website"], { encoding: "utf8" }).trim(),
    });
  } else {
    assert.equal(process.argv[2], "download", "Usage: candidate.mjs pack|download");
    candidate = await download(tag, path.resolve("_site"));
  }
  console.log(`Candidate ${candidate.tag}: ${candidate.digest}`);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `Candidate: [${tag}](${repository}/releases/tag/${tag})\n\n` +
    `Content: \`${candidate.contentSha}\`\n\nWebsite: \`${candidate.websiteSha}\`\n\n` +
    `Archive checksum: \`${candidate.digest}\`\n`);
}
