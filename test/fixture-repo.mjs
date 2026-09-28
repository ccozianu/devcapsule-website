// Turns the shared contract fixture into a Git repository with an immutable
// legacy tag, an immutable release tag and a working tree standing for main,
// the way the content checkout looks to the build.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const fixtures = path.resolve(import.meta.dirname, "fixtures/contract-1");

export function createFixtureRepo(name = "contract-1") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `website-${name}-`));
  const git = (...args) =>
    execFileSync("git", ["-C", dir, ...args], {
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: "Fixture",
        GIT_AUTHOR_EMAIL: "fixture@example.invalid",
        GIT_COMMITTER_NAME: "Fixture",
        GIT_COMMITTER_EMAIL: "fixture@example.invalid",
      },
    }).trim();
  git("init", "-q", "-b", "main");
  const commit = (tree, message, tag) => {
    for (const entry of fs.readdirSync(dir))
      if (entry !== ".git") fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
    fs.cpSync(path.join(fixtures, tree), dir, { recursive: true });
    git("add", "-A");
    git("commit", "-q", "-m", message);
    if (tag) git("tag", tag);
  };
  commit("legacy", "Legacy 0.9.0", "v0.9.0");
  commit("release", "Release 1.0.0", "v1.0.0");
  commit("main", "Main after 1.0.0");
  const cache = fs.mkdtempSync(path.join(os.tmpdir(), `website-${name}-cache-`));
  return {
    dir,
    cache,
    git,
    write: (file, text) => {
      fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
      fs.writeFileSync(path.join(dir, file), text);
    },
    read: (file) => fs.readFileSync(path.join(dir, file), "utf8"),
    remove: () => {
      fs.rmSync(dir, { recursive: true, force: true });
      fs.rmSync(cache, { recursive: true, force: true });
    },
  };
}
