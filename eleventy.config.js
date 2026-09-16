import { buildContent, siteUrl, prefix } from './scripts/content.mjs';
export default function(config) {
  const site = buildContent();
  config.addGlobalData('site', site);
  config.addGlobalData('preview', site.manifest.mode !== 'production');
  config.addGlobalData('origin', process.env.SITE_ORIGIN || '');
  config.addFilter('url', siteUrl);
  config.addFilter('shortsha', value => value.slice(0,7));
  config.addFilter('json', value => JSON.stringify(value, null, 2));
  config.addPassthroughCopy({ 'src/assets': 'assets' });
  for (const asset of site.assets) config.addPassthroughCopy({ [site.contentDir + '/' + asset]: 'content-assets/' + asset });
  return { dir: { input: 'src', output: '_site', includes: '_includes' }, pathPrefix: prefix(), templateFormats: ['njk'] };
}
