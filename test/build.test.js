import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { basename, relative, sep } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const run = promisify(execFile);
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const distRoot = new URL('../dist/', import.meta.url);
const contentRoot = new URL('../content/', import.meta.url);

async function listMarkdownFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, `${directory.href.replace(/\/$/, '')}/`);
    if (entry.isDirectory()) files.push(...await listMarkdownFiles(path));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(fileURLToPath(path));
  }
  return files;
}

test('static build emits canonical metadata, crawl files, RSS, and a real 404 page', async () => {
  await run(process.execPath, ['build.mjs'], { cwd: projectRoot });
  const [html, notFound, robots, sitemap, feed, favicon, markdownFiles] = await Promise.all([
    readFile(new URL('index.html', distRoot), 'utf8'),
    readFile(new URL('404.html', distRoot), 'utf8'),
    readFile(new URL('robots.txt', distRoot), 'utf8'),
    readFile(new URL('sitemap.xml', distRoot), 'utf8'),
    readFile(new URL('feed.xml', distRoot), 'utf8'),
    readFile(new URL('favicon.svg', distRoot), 'utf8'),
    listMarkdownFiles(contentRoot)
  ]);

  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/yuki\.art\/">/);
  assert.match(html, /property="og:description"/);
  assert.match(html, /type="application\/rss\+xml"/);
  assert.match(html, /alt="银白色头发、浅色双眼的角色正面特写"/);
  assert.match(html, /<footer class="site-footer"/);
  assert.match(html, /quick-browse\.js\?v=[a-f0-9]{12}/);
  assert.match(html, /post-sharing\.js\?v=[a-f0-9]{12}/);
  assert.match(html, /class="entry-share"/);
  const shareButton = html.match(/<button class="entry-share"[\s\S]*?<\/button>/)?.[0] || '';
  assert.match(shareButton, /<path d="m[^\"]+" \/>/);
  assert.equal((shareButton.match(/<circle\b/g) || []).length, 3);
  assert.match(html, /href="\/p\/2026-10-01T12-56-44\.177Z-ff2a5da7937043908c5f44bd77a4229c\/"/);
  assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/);
  assert.doesNotMatch(html, /rel="(?:next|prev)"/);

  assert.match(notFound, /<meta name="robots" content="noindex, nofollow, noarchive">/);
  assert.match(notFound, /页面不存在/);
  assert.match(notFound, /style\.css\?v=[a-f0-9]{12}/);
  assert.match(robots, /Sitemap: https:\/\/yuki\.art\/sitemap\.xml/);
  assert.match(robots, /Disallow: \/write/);
  assert.match(sitemap, /<loc>https:\/\/yuki\.art\/<\/loc>/);
  const sitemapPostUrls = [...sitemap.matchAll(/<loc>(https:\/\/yuki\.art\/p\/[^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(sitemapPostUrls.length, markdownFiles.length);
  assert.match(sitemap, /<loc>https:\/\/yuki\.art\/p\/2026-10-01T12-56-44\.177Z-ff2a5da7937043908c5f44bd77a4229c\/<\/loc>/);
  assert.match(feed, /<rss version="2\.0">/);
  assert.match(feed, /<language>zh-CN<\/language>/);
  assert.ok((feed.match(/<item>/g) || []).length > 0);
  assert.match(feed, /<link>https:\/\/yuki\.art\/p\/2026-10-01T12-56-44\.177Z-ff2a5da7937043908c5f44bd77a4229c\/\?<\/link>|<link>https:\/\/yuki\.art\/p\/2026-10-01T12-56-44\.177Z-ff2a5da7937043908c5f44bd77a4229c\/</);
  assert.ok(feed.includes('<link>https://yuki.art/p/2026-10-01T12-56-44.177Z-ff2a5da7937043908c5f44bd77a4229c/</link>'));
  assert.match(favicon, /<svg\s/);

  for (const file of markdownFiles) {
    const key = basename(file, '.md');
    const page = await readFile(new URL(`p/${key}/index.html`, distRoot), 'utf8');
    const canonical = `https://yuki.art/p/${key}/`;
    const entryPath = relative(fileURLToPath(contentRoot), file).split(sep).join('/').replace(/\.md$/, '');
    const entryId = `entry-${entryPath.replace(/[^A-Za-z0-9_-]+/g, '-')}`;

    assert.ok(page.includes(`<link rel="canonical" href="${canonical}">`));
    assert.match(page, /<meta property="og:type" content="article">/);
    assert.ok(page.includes(`<meta property="og:url" content="${canonical}">`));
    assert.match(page, new RegExp(`data-initial-entry="${entryId}"`));
    assert.match(page, /<meta property="article:published_time" content="\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z">/);
    assert.doesNotMatch(page, /\{\{[A-Z_]+\}\}/);
  }

  const featuredPost = await readFile(new URL('p/2026-10-01T12-56-44.177Z-ff2a5da7937043908c5f44bd77a4229c/index.html', distRoot), 'utf8');
  assert.match(featuredPost, /<meta property="og:title" content="史莱姆想要，史莱姆得到！">/);
  assert.match(featuredPost, /<meta property="og:description" content="史莱姆想要，史莱姆得到！ 现在的AI应该是最好用的时候了，你只需要三步就能得到你想要的 A）想好你想要的 B）想好你想让AI做的 C）想好你的审核标准 如果结果不是你想要的，肯定不是AI的错，就逆着往上推，肯定是你想错了 科技可以在现在锁死了，再发展下去让AI有了人格和感情，肯定不如现在好用">/);
  assert.match(feed, /<guid isPermaLink="true">https:\/\/yuki\.art\/#entry-2026-10-2026-10-01T12-56-44-177Z-ff2a5da7937043908c5f44bd77a4229c<\/guid>/);
});
