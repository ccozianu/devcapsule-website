import assert from "node:assert/strict";

// Google verification files are root-level static responses, not rendered pages.
// Validate their entire body before exempting them from page metadata checks.
export function isGoogleVerification(relativePath, body) {
  if (!/^google[a-f0-9]+\.html$/.test(relativePath)) return false;
  assert.equal(body.replace(/\r?\n$/, ""),
    `google-site-verification: ${relativePath}`,
    `Invalid Google verification file: ${relativePath}`);
  return true;
}
