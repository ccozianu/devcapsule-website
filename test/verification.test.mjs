import test from "node:test";
import assert from "node:assert/strict";
import { isGoogleVerification } from "../scripts/verification.mjs";

test("only root Google verification responses bypass page checks", () => {
  const name = "googledda808d7513923e5.html";
  const body = `google-site-verification: ${name}`;
  for (const suffix of ["", "\n", "\r\n"])
    assert.equal(isGoogleVerification(name, body + suffix), true);
  assert.equal(isGoogleVerification(`docs/${name}`, body), false);
  assert.equal(isGoogleVerification("index.html", body), false);
  for (const invalid of ["", body.replace("dda808", "aaaaaa"), body + "<h1>extra</h1>"])
    assert.throws(() => isGoogleVerification(name, invalid), /Invalid Google verification/);
});
