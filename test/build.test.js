import assert from 'node:assert/strict';
import test from 'node:test';
import { writeFile, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fixtureSite, build, read, run } from './fixture-site.mjs';

test('SSR, share metadata, literal placeholders, line breaks, links and valid XML', async () => {
  const { root, keys } = await fixtureSite();
  try {
    await writeFile(join(root, `content/2026/10/${keys[0]}.md`), 'Literal {{TIMELINE}} {{UNKNOWN}}\nLine A\nLine B\n\nhttps://example.com/\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))\n\n![pixel](/images/2026/10/pixel.webp)\n\nXML\u000bcontrol');
    await build(root);
    const home = await read(root, 'index.html');
    const share = await read(root, `p/${keys[0]}/index.html`);
    assert.match(home, /Literal \{\{TIMELINE\}\} \{\{UNKNOWN\}\}/);
    assert.match(home, /Line A<br\s*\/?>\s*Line B/);
    assert.match(home, /href="https:\/\/example.com\/"/);
    assert.doesNotMatch(home, /<script>alert|href="javascript:/);
    assert.match(home, /width="1" height="1"/);
    assert.match(home, /class="site-footer"/);
    assert.match(share, /name="twitter:card" content="summary_large_image"/);
    assert.match(share, /"@type":"SocialMediaPosting"/);
    assert.match(share, /"@type":"Person"/);
    assert.equal((share.match(/class="entry"/g) || []).length, 1);
    const status = JSON.parse(await read(root, `p/${keys[0]}/status.json`));
    assert.equal(status.key, keys[0]); assert.match(status.bodyHash, /^[a-f0-9]{64}$/);
    await run('python3', ['-c', 'import xml.etree.ElementTree as E,sys; [E.parse(p) for p in sys.argv[1:]]', join(root, 'dist/feed.xml'), join(root, 'dist/sitemap.xml')]);
    assert.match(await read(root, '404.html'), /noindex/);
    assert.match(await read(root, 'about/index.html'), /关于这条时间流/);
    assert.match(await read(root, 'robots.txt'), /Disallow: \/api\//);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('missing, fake and corrupt WebP resources stop a build', async () => {
  const { root } = await fixtureSite();
  try {
    const file = join(root, 'public/images/2026/10/pixel.webp');
    await rm(file); await assert.rejects(build(root), /ENOENT|missing/i);
    await writeFile(file, Buffer.from('RIFF\x04\0\0\0WEBP', 'binary'));
    await assert.rejects(build(root), /WebP|payload|image/i);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('timestamp folder mismatch is rejected', async () => {
  const { root, keys } = await fixtureSite();
  try {
    await mkdir(join(root, 'content/2026/09'), { recursive: true });
    await writeFile(join(root, `content/2026/09/${keys[0]}.md`), 'Mismatch');
    await assert.rejects(build(root), /must be stored under/i);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('1000 posts keep share output linear and homepage small', async () => {
  const { root, keys } = await fixtureSite(1000);
  try {
    const result = await build(root);
    const home = await read(root, 'index.html');
    const share = await read(root, `p/${keys[500]}/index.html`);
    assert.equal((home.match(/class="entry"/g) || []).length, 12);
    assert.equal((share.match(/class="entry"/g) || []).length, 1);
    assert.ok(Buffer.byteLength(home) < 60000);
    assert.match(result.stdout, /Built 1000 UTC posts/);
    const indexPath = home.match(/data-timeline-index="([^"]+)"/)[1];
    const index = JSON.parse(await read(root, indexPath));
    assert.equal(index.entries.length, 1000); assert.equal(index.chunks.length, 84);
    assert.ok(index.entries.every((entry, n) => entry.order === n));
  } finally { await rm(root, { recursive: true, force: true }); }
});
