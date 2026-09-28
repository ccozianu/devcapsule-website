import { buildContent, siteUrl, prefix } from "./scripts/content.mjs";
export default function (config) {
  const site = buildContent();
  config.addGlobalData("site", site);
  config.addGlobalData("preview", site.manifest.mode !== "production");
  config.addGlobalData("origin", process.env.SITE_ORIGIN || "");
  config.addFilter("url", siteUrl);
  config.addFilter("shortsha", (value) => value.slice(0, 7));
  config.addFilter("buildtime", (value) =>
    new Date(value).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC",
    }) + " UTC",
  );
  config.addFilter("datelabel", (value) =>
    new Date(value + "T12:00:00Z").toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
    }),
  );
  config.addFilter("json", (value) => JSON.stringify(value, null, 2));
  config.addPassthroughCopy({ "src/assets": "assets" });
  config.addPassthroughCopy({ "src/static": "." });
  // Images referenced by content, keyed by the source they were read from:
  // "main" for the checkout, the short commit for an immutable version source.
  for (const [key, { tree, files }] of Object.entries(site.versionAssets))
    for (const asset of files)
      config.addPassthroughCopy({
        [tree + "/" + asset]: `content-assets/${key}/${asset}`,
      });
  return {
    dir: { input: "src", output: "_site", includes: "_includes" },
    pathPrefix: prefix(),
    templateFormats: ["njk"],
  };
}
