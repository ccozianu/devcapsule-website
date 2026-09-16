import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import MarkdownIt from 'markdown-it';
import GithubSlugger from 'github-slugger';
import { load } from 'cheerio';
import hljs from 'highlight.js';

export const root = path.resolve(import.meta.dirname, '..');
export const repository = 'https://github.com/ccozianu/devcapsule';
export function contentRoot() {
  const dir = process.env.CONTENT_DIR ? path.resolve(process.env.CONTENT_DIR)
    : fs.existsSync(path.join(root, '../devcapsule-src')) ? path.resolve(root, '..') : path.join(root, '.content');
  if (!fs.existsSync(path.join(dir, 'engineering-docs/blog/README.md'))) {
    throw new Error('Content checkout missing. Set CONTENT_DIR=/path/to/devcapsule or run npm run content:fetch.');
  }
  return dir;
}
export function prefix() {
  const value = process.env.SITE_BASE_PATH || '/';
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(value)) throw new Error('SITE_BASE_PATH must be / or /path/ with a trailing slash.');
  return value;
}
export const siteUrl = (url) => prefix() + url.replace(/^\//, '');
export function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name)).flatMap(entry =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : entry.isFile() ? [path.join(dir, entry.name)] : []);
}
function git(dir, args) { return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' }).trim(); }
export function identity(dir) {
  return { revision: git(dir, ['rev-parse', 'HEAD']), dirty: Boolean(git(dir, ['status', '--porcelain', '--untracked-files=normal'])) };
}
const encodePath = file => file.split('/').map(encodeURIComponent).join('/');
export function route(file) {
  if (file === 'README.md') return '/';
  if (file === 'docs/README.md') return '/docs/';
  if (file === 'engineering-docs/blog/README.md') return '/blog/';
  if (file.startsWith('engineering-docs/blog/')) return '/blog/' + file.slice('engineering-docs/blog/'.length).replace(/\.md$/, '/') ;
  return '/' + file.replace(/\.md$/, '/');
}
export function rewriteLink(href, file, files, dir, revision, assets) {
  if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)) return href;
  const match = href.match(/^([^?#]*)([?#].*)?$/);
  const target = path.posix.normalize(path.posix.join(href.startsWith('/') ? '' : path.posix.dirname(file), decodeURIComponent(match[1]).replace(/^\//, '')));
  if (target.startsWith('../')) throw new Error(`Link escapes content root: ${file}: ${href}`);
  const suffix = match[2] || '';
  if (files.has(target)) return siteUrl(route(target)) + suffix;
  if (/\.(?:png|jpg|jpeg|gif|svg|webp|avif)$/i.test(target)) {
    if (!fs.existsSync(path.join(dir, target))) throw new Error(`Missing image: ${target}`);
    assets.add(target);
    return siteUrl('/content-assets/' + encodePath(target)) + suffix;
  }
  if (!fs.existsSync(path.join(dir, target))) throw new Error(`Broken source link in ${file}: ${href}`);
  return `${repository}/blob/${revision}/${encodePath(target)}${suffix}`;
}
export function render(source, file, files, dir, revision, assets) {
  const md = new MarkdownIt({ html: true, linkify: true, highlight(code, language) {
    return language && hljs.getLanguage(language) ? hljs.highlight(code, { language }).value : '';
  }});
  const $ = load(md.render(source), null, false);
  const slugger = new GithubSlugger();
  $('h1,h2,h3,h4,h5,h6').each((_, element) => { const el = $(element); el.attr('id', slugger.slug(el.text())); });
  $('a[href], img[src]').each((_, element) => {
    const el = $(element); const attr = element.tagName === 'img' ? 'src' : 'href';
    el.attr(attr, rewriteLink(el.attr(attr), file, files, dir, revision, assets));
  });
  $('table').each((i, el) => $(el).wrap(`<div class="table-scroll" role="region" aria-label="Table ${i + 1}" tabindex="0"></div>`));
  $('pre').attr('tabindex', '0');
  const title = $('h1').first().text();
  const titleId = $('h1').first().attr('id');
  $('h1').first().remove();
  const toc = $('h2,h3').map((_, el) => ({ title: $(el).text(), id: $(el).attr('id'), sub: el.tagName === 'h3' })).get();
  const description = $('p').filter((_, el) => $(el).text().trim().length > 40).first().text().replace(/\s+/g,' ').trim();
  return { title, titleId, html: $.html(), toc, description };
}
function landing(record) {
  const $ = load(record.html, null, false);
  const sections = {};
  $('h2,h3').each((_, el) => {
    const heading = $(el); const nodes = heading.nextUntil('h2,h3');
    sections[heading.text()] = { heading: heading.text(), id: heading.attr('id'), html: nodes.map((_, node) => $.html(node)).get().join('\n') };
  });
  const essence = Object.values(sections).find(s => s.heading.startsWith('The essence of why DevCapsule:'));
  if (!essence || !sections['Why DevCapsule?'] || !sections['Aim for engineering excellence. Keep the fun.']) {
    throw new Error('README landing headings changed; update the presentation adapter in scripts/content.mjs.');
  }
  const body = load(essence.html, null, false);
  const paragraphs = body('p').toArray().map(el => body.html(el));
  return {
    headline: essence.heading.replace('The essence of why DevCapsule: ', '').replace(/^s/, 'S'),
    id: essence.id, lead: paragraphs[0], motto: paragraphs[1], features: paragraphs.slice(2,4), boundary: paragraphs.slice(4).join('\n'),
    intro: { ...sections['Why DevCapsule?'], html: Object.values(sections).filter(s => s.heading.startsWith('For the really')).map(s => `<h3 id="${s.id}">${s.heading}</h3>${s.html}`).join('') }, philosophy: sections['Aim for engineering excellence. Keep the fun.'], comparison: sections['But is it really needed?'],
    badges: $('img').toArray().map(el => $.html($(el).closest('a'))).join(' '),
  };
}
export function buildContent() {
  const dir = contentRoot();
  const content = identity(dir); const implementation = identity(root); const assets = new Set();
  const filenames = ['README.md', ...walk(path.join(dir, 'docs')).filter(p => p.endsWith('.md')).map(p => path.relative(dir,p)),
    ...walk(path.join(dir, 'engineering-docs/blog')).filter(p => p.endsWith('.md')).map(p => path.relative(dir,p))];
  const files = new Set(filenames);
  const hash = createHash('sha256');
  const pages = filenames.filter(file => file !== 'engineering-docs/blog/README.md').map(file => {
    const source = fs.readFileSync(path.join(dir,file),'utf8'); hash.update(file + '\0' + source + '\0');
    const rendered = render(source,file,files,dir,content.revision,assets);
    const kind = file === 'README.md' ? 'home' : file.startsWith('engineering-docs/blog/') ? 'post' : 'doc';
    const date = kind === 'post' ? path.basename(file).slice(0,10) : null;
    return { ...rendered, file, url: route(file), permalink: route(file), kind, date,
      dateLabel: date ? new Date(date + 'T12:00:00Z').toLocaleDateString('en-GB', { day:'numeric', month:'long',year:'numeric',timeZone:'UTC' }) : '',
      minutes: Math.max(1, Math.ceil(source.split(/\s+/).length / 220)),
      excerpt: rendered.description.length > 210 ? rendered.description.slice(0,207).replace(/\s+\S*$/, '') + '…' : rendered.description,
      historical: file.includes('/product/') || file.includes('docker4pycharm'),
      sourceUrl: `${repository}/blob/${content.revision}/${encodePath(file)}`,
      ...(kind === 'home' ? { landing: landing(rendered) } : {}) };
  });
  const posts = pages.filter(p => p.kind === 'post').sort((a,b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  const navFiles = ['docs/README.md','docs/guides/first-session.md','docs/guides/your-project.md','docs/guides/windows-wsl2.md'];
  const labels = ['Overview', 'Your first session', 'Your own project & AI', 'Windows & WSL2'];
  const navigation = navFiles.map((file,i) => ({ ...pages.find(p => p.file === file), label: labels[i] }));
  navigation.push(...pages.filter(p => p.kind === 'doc' && !p.historical && !navFiles.includes(p.file)).map(p => ({ ...p, label:p.title })));
  const background = pages.filter(p => p.historical);
  for (const asset of [...assets].sort()) hash.update(asset + '\0').update(fs.readFileSync(path.join(dir,asset)));
  const manifest = { schema: 1, content: { ...content, sha256: hash.digest('hex') }, implementation,
    basePath: prefix(), mode: process.env.SITE_MODE || 'preview', pages: pages.map(p => ({file:p.file,url:siteUrl(p.url)})) };
  return { pages, posts, navigation, background, assets: [...assets], manifest, contentDir: dir };
}
