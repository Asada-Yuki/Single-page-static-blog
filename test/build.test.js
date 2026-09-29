import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const run = promisify(execFile);
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const distRoot = new URL('../dist/', import.meta.url);

test('static build emits canonical metadata, crawl files, RSS, and a real 404 page', async () => {
  await run(process.execPath, ['build.mjs'], { cwd: projectRoot });
  const [html, notFound, robots, sitemap, feed, favicon] = await Promise.all([
    readFile(new URL('index.html', distRoot), 'utf8'),
    readFile(new URL('404.html', distRoot), 'utf8'),
    readFile(new URL('robots.txt', distRoot), 'utf8'),
    readFile(new URL('sitemap.xml', distRoot), 'utf8'),
    readFile(new URL('feed.xml', distRoot), 'utf8'),
    readFile(new URL('favicon.svg', distRoot), 'utf8')
  ]);

  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/yuki\.art\/">/);
  assert.match(html, /property="og:description"/);
  assert.match(html, /type="application\/rss\+xml"/);
  assert.match(html, /alt="银白色头发、浅色双眼的角色正面特写"/);
  assert.match(html, /<footer class="site-footer"/);
  assert.match(html, /quick-browse\.js\?v=[a-f0-9]{12}/);
  assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/);
  assert.doesNotMatch(html, /rel="(?:next|prev)"/);

  assert.match(notFound, /<meta name="robots" content="noindex, nofollow, noarchive">/);
  assert.match(notFound, /页面不存在/);
  assert.match(notFound, /style\.css\?v=[a-f0-9]{12}/);
  assert.match(robots, /Sitemap: https:\/\/yuki\.art\/sitemap\.xml/);
  assert.match(robots, /Disallow: \/write/);
  assert.match(sitemap, /<loc>https:\/\/yuki\.art\/<\/loc>/);
  assert.match(feed, /<rss version="2\.0">/);
  assert.match(feed, /<language>zh-CN<\/language>/);
  assert.ok((feed.match(/<item>/g) || []).length > 0);
  assert.match(favicon, /<svg\s/);
});
