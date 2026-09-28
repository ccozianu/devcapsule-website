// The consumer's check for the producer's gate: assemble the site from a
// content checkout under contract version 1 without writing any output, and
// name the first file, field, version or role that breaks it.
//
//   CONTENT_DIR=/path/to/devcapsule node scripts/contract-check.mjs
//   npm run check:content            # inside DevCapsule's website.sh
//
// SITE_MODE=production also drops drafts, as the published build does.
import { buildContent } from "./content.mjs";
import { ContractError, CONTRACT } from "./contract.mjs";

try {
  const site = buildContent();
  const versions = site.versions
    .map((v) => `${v.label}${v.current ? " (current)" : ""}: ${v.status}, ${site.pages.filter((p) => p.kind === "doc" && p.copy === "version" && p.version.version === v.version).length} pages`)
    .join("; ");
  const roles = Object.entries(site.roles).map(([role, url]) => `${role} → ${url}`).join(", ");
  console.log(
    `Contract ${CONTRACT}: ${site.pages.length} pages including ${site.pages.filter((p) => p.kind === "alias").length} aliases; versions ${versions}; roles ${roles}; rendered ${site.stats.rendered.join(", ") || "none"}, reused ${site.stats.reused.join(", ") || "none"}: passed.`,
  );
} catch (error) {
  if (error instanceof ContractError) {
    console.error(`Content contract ${CONTRACT} violated: ${error.message}`);
    process.exit(1);
  }
  throw error;
}
