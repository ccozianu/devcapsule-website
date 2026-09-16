import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {rewriteLink,render,route} from '../scripts/content.mjs';
const files=new Set(['README.md','docs/README.md','docs/guides/first-session.md','docs/guides/windows-wsl2.md','engineering-docs/blog/README.md']);
const sha='a'.repeat(40);
test('Markdown routes, anchors, queries and encoded paths preserve navigation',()=>{
  assert.equal(rewriteLink('windows-wsl2.md#before-you-start','docs/guides/first-session.md',files,'/unused',sha,new Set()),'/docs/guides/windows-wsl2/#before-you-start');
  assert.equal(rewriteLink('../../README.md?from=docs#why-devcapsule','docs/guides/first-session.md',files,'/unused',sha,new Set()),'/?from=docs#why-devcapsule');
  assert.equal(route('engineering-docs/blog/README.md'),'/blog/');
  const permalink='https://github.com/ccozianu/devcapsule/blob/'+sha+'/AGENTS.md';
  assert.equal(rewriteLink(permalink,'README.md',files,'/unused',sha,new Set()),permalink);
});
test('non-published content links use source revision; missing files fail',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'website-link-'));
  try {
    fs.writeFileSync(path.join(dir,'DEVELOPING.md'),'Developer material');
    assert.equal(rewriteLink('../DEVELOPING.md','docs/README.md',files,dir,sha,new Set()),`https://github.com/ccozianu/devcapsule/blob/${sha}/DEVELOPING.md`);
    assert.throws(()=>rewriteLink('missing.md','README.md',files,dir,sha,new Set()),/Broken source link/);
    assert.throws(()=>rewriteLink('../../private','README.md',files,dir,sha,new Set()),/escapes/);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('headings use GitHub slugs, repeated headings are unique, and templates stay literal',()=>{
  const result=render('# Guide\n\n{{ secret }}\n\n## Hello, world!\n\n## Hello, world!\n\n```sh\necho "{{ site.password }}"\n```','README.md',files,'/unused',sha,new Set());
  assert.deepEqual(result.toc.map(h=>h.id),['hello-world','hello-world-1']);
  assert.match(result.html,/\{\{ secret \}\}/);
  assert.match(result.html,/site.password/);
});
test('subdirectory deployment rewrites internal routes without changing external links',()=>{
  const previous=process.env.SITE_BASE_PATH;
  try {process.env.SITE_BASE_PATH='/devcapsule/';assert.equal(rewriteLink('docs/README.md','README.md',files,'/unused',sha,new Set()),'/devcapsule/docs/');}
  finally {if(previous===undefined) delete process.env.SITE_BASE_PATH;else process.env.SITE_BASE_PATH=previous;}
});
