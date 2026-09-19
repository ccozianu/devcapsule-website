import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { pack, download, unpack } from "../scripts/candidate.mjs";

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "website-release-test-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const site = path.join(dir, "site");
  fs.mkdirSync(site);
  const source = { tag: "website-candidate-123-1", runId: "123", runAttempt: "1",
    contentSha: "1".repeat(40), websiteSha: "2".repeat(40) };
  fs.writeFileSync(path.join(site, "build-info.json"), JSON.stringify({
    schema: 1, mode: "production", basePath: "/",
    content: { revision: source.contentSha, dirty: false, sha256: "3".repeat(64) },
    implementation: { revision: source.websiteSha, dirty: false },
  }));
  fs.writeFileSync(path.join(site, "index.html"),
    '<link rel="canonical" href="https://test-devcapsule.mycodespace.ai/"><h1>Reviewed content</h1>');
  fs.writeFileSync(path.join(site, "robots.txt"), "User-agent: *\nAllow: /\n");
  fs.writeFileSync(path.join(site, "image.bin"), Buffer.from([0, 255, 128]));
  return { dir, site, source, bundle: path.join(dir, "bundle") };
}

test("public release download promotes packed bytes with no authentication", async t => {
  const { dir, site, source, bundle } = fixture(t);
  const verificationName = "googledda808d7513923e5.html";
  const verification = fs.readFileSync(new URL(`../src/static/${verificationName}`, import.meta.url));
  fs.writeFileSync(path.join(site, verificationName), verification);
  const original = fs.readFileSync(path.join(site, "index.html"), "utf8");
  pack(site, bundle, source);
  assert.equal(fs.readFileSync(path.join(site, "index.html"), "utf8"), original);
  const calls = [];
  const request = async (...args) => {
    calls.push(args);
    const name = new URL(args[0]).pathname.split("/").at(-1);
    return new Response(fs.readFileSync(path.join(bundle, name)));
  };
  const output = path.join(dir, "output");
  await download(source.tag, output, request);
  assert.equal(calls.length, 2);
  assert(calls.every(args => args.length === 1 && args[0].startsWith(
    'https://github.com/ccozianu/devcapsule/releases/download/website-candidate-123-1/')));
  assert.equal(fs.readFileSync(path.join(output, "index.html"), "utf8"),
    original.replace("https://test-devcapsule.", "https://devcapsule."));
  assert.deepEqual(fs.readFileSync(path.join(output, "image.bin")), Buffer.from([0, 255, 128]));
  assert.deepEqual(fs.readFileSync(path.join(output, verificationName)), verification);
});

test("corrupt release archive fails before extraction", t => {
  const { dir, site, source, bundle } = fixture(t);
  const candidate = pack(site, bundle, source);
  const archive = path.join(bundle, "website.tar.gz");
  fs.appendFileSync(archive, "tampered");
  const output = path.join(dir, "output");
  assert.throws(() => unpack(archive, output, candidate), /checksum mismatch/);
  assert(!fs.existsSync(output));
});

test("malformed candidate tags and missing public assets fail", async t => {
  const { dir, source } = fixture(t);
  const request = async () => new Response("Not found", { status: 404 });
  await assert.rejects(download("../../other", path.join(dir, "a"), request));
  await assert.rejects(download(source.tag, path.join(dir, "b"), request), /download failed \(404\)/);
});

test("archive links and traversal are rejected before extraction", t => {
  const { dir, site } = fixture(t);
  for (const mode of ["link", "traversal"]) {
    const archive = path.join(dir, mode + ".tar.gz");
    if (mode === "link") {
      fs.symlinkSync("/tmp", path.join(site, "escape"));
      execFileSync("tar", ["-czf", archive, "-C", site, "escape"]);
    } else {
      execFileSync("tar", ["-czf", archive, "--transform=s|index.html|../escape.html|", "-C", site, "index.html"]);
    }
    const candidate = { digest: "sha256:" + createHash("sha256").update(fs.readFileSync(archive)).digest("hex") };
    const output = path.join(dir, mode);
    assert.throws(() => unpack(archive, output, candidate), /only ordinary files|Unsupported archive path/);
    assert(!fs.existsSync(output));
  }
});
