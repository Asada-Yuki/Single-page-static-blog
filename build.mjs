import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const root = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(root, 'content');
const publicRoot = join(root, 'public');
const distRoot = join(root, 'dist');
const timestampPattern = /^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z)(?:-[a-f0-9]{8}|-[a-f0-9]{32})?\.md$/;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function parseVideoUrl(raw) {
  if (!raw || /\s/.test(raw)) return null;

  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, '');

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    const watchId = url.pathname === '/watch' ? url.searchParams.get('v') : null;
    const pathId = url.pathname.match(/^\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})\/?$/)?.[1];
    const id = watchId || pathId;
    return id && /^[A-Za-z0-9_-]{11}$/.test(id)
      ? { src: `https://www.youtube-nocookie.com/embed/${id}` }
      : null;
  }

  if (host === 'youtu.be') {
    const id = url.pathname.match(/^\/([A-Za-z0-9_-]{11})\/?$/)?.[1];
    return id ? { src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = url.pathname.match(/^(?:\/video)?\/(\d+)\/?$/)?.[1];
    return id ? { src: `https://player.vimeo.com/video/${id}` } : null;
  }

  if (host === 'bilibili.com' || host === 'm.bilibili.com') {
    const id = url.pathname.match(/^\/video\/(BV[0-9A-Za-z]{10}|av\d+)\/?$/i)?.[1];
    if (!id) return null;
    const isBvid = /^BV/i.test(id);
    const query = isBvid
      ? `bvid=${encodeURIComponent(id)}&page=1&high_quality=1&danmaku=0`
      : `aid=${id.slice(2)}&page=1&high_quality=1&danmaku=0`;
    return { src: `https://player.bilibili.com/player.html?${query}` };
  }

  return null;
}

function videoBlockRule(state, startLine, endLine, silent) {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const end = state.eMarks[startLine];
  const raw = state.src.slice(start, end).trim();
  const video = parseVideoUrl(raw);
  if (!video) return false;
  if (silent) return true;

  const token = state.push('video_embed', 'div', 0);
  token.block = true;
  token.meta = video;
  state.line = startLine + 1;
  return true;
}

const md = new MarkdownIt('commonmark', {
  html: false,
  linkify: true,
  typographer: false,
  breaks: true
});

md.validateLink = (href) => {
  const value = String(href).trim();
  return /^(?:https?:|mailto:)/i.test(value)
    || (value.startsWith('/') && !value.startsWith('//'))
    || value.startsWith('#');
};

md.block.ruler.before('paragraph', 'video_embed', videoBlockRule);
md.renderer.rules.video_embed = (tokens, index) => {
  const src = escapeHtml(tokens[index].meta.src);
  return `<div class="video-embed"><iframe src="${src}" title="External video" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>\n`;
};

md.renderer.rules.image = (tokens, index, options, env, self) => {
  const token = tokens[index];
  const src = token.attrGet('src') || '';
  if (!/^\/images\/\d{4}\/\d{2}\/[A-Za-z0-9._-]+\.webp$/.test(src)) {
    return md.utils.escapeHtml(token.content || '');
  }
  token.attrSet('alt', token.content || '');
  token.attrSet('loading', 'lazy');
  token.attrSet('decoding', 'async');
  return self.renderToken(tokens, index, options);
};

async function collectPosts(directory) {
  const posts = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      posts.push(...await collectPosts(path));
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

    const match = entry.name.match(timestampPattern);
    if (!match) throw new Error(`Post filename is not a UTC timestamp: ${relative(root, path)}`);
    const iso = match[1].replace(/T(\d{2})-(\d{2})-(\d{2})\./, 'T$1:$2:$3.');
    const timestamp = new Date(iso);
    if (Number.isNaN(timestamp.getTime()) || timestamp.toISOString() !== iso) {
      throw new Error(`Invalid UTC timestamp: ${relative(root, path)}`);
    }

    const rel = relative(contentRoot, path).split(sep).join('/');
    const expectedDir = `${timestamp.toISOString().slice(0, 4)}/${timestamp.toISOString().slice(5, 7)}`;
    if (!rel.startsWith(`${expectedDir}/`)) {
      throw new Error(`Post must be stored under content/${expectedDir}/: ${relative(root, path)}`);
    }

    posts.push({
      iso: timestamp.toISOString(),
      body: await readFile(path, 'utf8'),
      path: rel
    });
  }

  return posts;
}

function formatUtcDate(iso) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(iso));
  return `${parts.toUpperCase()} · UTC`;
}

function formatUtcTime(iso) {
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(new Date(iso));
  return `${time} UTC`;
}

function formatUtcShortDate(iso) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short'
  }).format(new Date(iso)).toUpperCase();
}

function fillTemplate(template, values, name) {
  let output = template;
  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(`{{${key}}}`, () => value);
  }
  const unresolved = output.match(/\{\{[A-Z_]+\}\}/);
  if (unresolved) throw new Error(`${name} contains an unresolved template value: ${unresolved[0]}`);
  return output;
}

function entryId(post) {
  return `entry-${post.path.replace(/\.md$/, '').replace(/[^A-Za-z0-9_-]+/g, '-')}`;
}

function previewText(body) {
  const plainText = body
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/^\s{0,3}(?:#{1,6}\s+|>+\s?)/gm, '')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const characters = Array.from(plainText || '媒体内容');
  return characters.length > 100 ? `${characters.slice(0, 100).join('')}…` : characters.join('');
}

function renderQuickBrowse(posts) {
  if (posts.length === 0) return '';

  const links = posts.slice(0, 8).map((post) => {
    const dateTime = `${formatUtcShortDate(post.iso)} · ${formatUtcTime(post.iso)}`;
    const preview = previewText(post.body);
    return `
      <li class="quick-browse__item">
        <a class="quick-browse__link" href="#${entryId(post)}" aria-label="${escapeHtml(`${dateTime}: ${preview}`)}">
          <span class="quick-browse__mark" aria-hidden="true"></span>
          <span class="quick-browse__mobile-label" lang="en" aria-hidden="true">${formatUtcTime(post.iso).replace(' UTC', '')}</span>
          <span class="quick-browse__preview" aria-hidden="true">
            <span class="quick-browse__meta" lang="en">${dateTime}</span>
            <span class="quick-browse__excerpt">${escapeHtml(preview)}</span>
          </span>
        </a>
      </li>`;
  }).join('\n');

  return `
    <nav class="quick-browse" aria-label="快速浏览最近内容">
      <ol class="quick-browse__list">
        ${links}
      </ol>
    </nav>`;
}

function renderTimeline(posts) {
  if (posts.length === 0) {
    return '<p class="timeline-empty" role="status">暂时还没有内容。所有时间均为 UTC。</p>';
  }

  const groups = new Map();
  for (const post of posts) {
    const date = post.iso.slice(0, 10);
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date).push(post);
  }

  return [...groups.entries()].map(([date, entries]) => {
    const dateTime = `${date}T00:00:00.000Z`;
    const renderedEntries = entries.map((post) => `
      <article class="entry" id="${entryId(post)}">
        <time class="entry-time" lang="en" datetime="${escapeHtml(post.iso)}">${formatUtcTime(post.iso)}</time>
        <div class="entry-content">${md.render(post.body)}</div>
      </article>`).join('\n');
    return `
      <section class="day" aria-label="${formatUtcDate(dateTime)}">
      <time class="day-date" lang="en" datetime="${date}T00:00:00Z">${formatUtcDate(dateTime)}</time>
        ${renderedEntries}
      </section>`;
  }).join('\n');
}

function renderFeed(posts, site, siteUrl) {
  const items = posts.slice(0, 20).map((post) => {
    const link = `${siteUrl}/#${entryId(post)}`;
    const title = `${post.iso.slice(0, 10)} · ${formatUtcTime(post.iso)}`;
    return `
    <item>
      <title>${escapeHtml(title)}</title>
      <link>${escapeHtml(link)}</link>
      <guid isPermaLink="true">${escapeHtml(link)}</guid>
      <pubDate>${new Date(post.iso).toUTCString()}</pubDate>
      <description>${escapeHtml(previewText(post.body))}</description>
    </item>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeHtml(site.name)}</title>
    <link>${escapeHtml(`${siteUrl}/`)}</link>
    <description>${escapeHtml(site.description)}</description>
    <language>${escapeHtml(site.lang)}</language>${items}
  </channel>
</rss>
`;
}

function renderSitemap(posts, siteUrl) {
  const lastModified = posts[0] ? `\n    <lastmod>${posts[0].iso}</lastmod>` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeHtml(`${siteUrl}/`)}</loc>${lastModified}
  </url>
</urlset>
`;
}

async function main() {
  const site = JSON.parse(await readFile(join(root, 'site.json'), 'utf8'));
  if (typeof site.name !== 'string' || !site.name.trim()) throw new Error('site.json must contain a non-empty name.');
  if (typeof site.url !== 'string' || !site.url.trim()) throw new Error('site.json must contain a canonical HTTPS url.');
  if (typeof site.lang !== 'string' || !/^[a-z]{2}(?:-[A-Za-z0-9]+)*$/.test(site.lang.trim())) {
    throw new Error('site.json must contain a valid language tag.');
  }
  if (typeof site.description !== 'string' || !site.description.trim()) {
    throw new Error('site.json must contain a non-empty description.');
  }

  let configuredUrl;
  try {
    configuredUrl = new URL(site.url.trim());
  } catch {
    throw new Error('site.json url must be a valid HTTPS origin.');
  }
  if (configuredUrl.protocol !== 'https:' || configuredUrl.username || configuredUrl.password
    || configuredUrl.pathname !== '/' || configuredUrl.search || configuredUrl.hash) {
    throw new Error('site.json url must be an HTTPS origin without a path, query, or fragment.');
  }
  const siteUrl = configuredUrl.origin;

  const posts = await collectPosts(contentRoot);
  posts.sort((a, b) => b.iso.localeCompare(a.iso) || b.path.localeCompare(a.path));

  const template = await readFile(join(root, 'src', 'template.html'), 'utf8');
  const notFoundTemplate = await readFile(join(root, 'src', '404.html'), 'utf8');
  const stylesheet = await readFile(join(root, 'src', 'style.css'), 'utf8');
  const theme = await readFile(join(root, 'src', 'theme.js'), 'utf8');
  const imageViewer = await readFile(join(root, 'src', 'image-viewer.js'), 'utf8');
  const quickBrowse = await readFile(join(root, 'src', 'quick-browse.js'), 'utf8');
  const versionOf = (content) => createHash('sha256').update(content).digest('hex').slice(0, 12);
  const siteName = escapeHtml(site.name.trim());
  const siteDescription = escapeHtml(site.description.trim());
  const siteLang = escapeHtml(site.lang.trim());
  const templateValues = {
    SITE_NAME: siteName,
    SITE_DESCRIPTION: siteDescription,
    SITE_LANG: siteLang,
    SITE_URL: escapeHtml(siteUrl),
    YEAR: String(new Date().getUTCFullYear()),
    STYLE_VERSION: versionOf(stylesheet),
    THEME_VERSION: versionOf(theme),
    IMAGE_VIEWER_VERSION: versionOf(imageViewer),
    QUICK_BROWSE_VERSION: versionOf(quickBrowse),
    QUICK_BROWSE: renderQuickBrowse(posts),
    TIMELINE: renderTimeline(posts)
  };
  const html = fillTemplate(template, templateValues, 'src/template.html');
  const notFoundHtml = fillTemplate(notFoundTemplate, templateValues, 'src/404.html');

  await rm(distRoot, { recursive: true, force: true });
  await mkdir(distRoot, { recursive: true });
  await writeFile(join(distRoot, 'index.html'), html);
  await writeFile(join(distRoot, '404.html'), notFoundHtml);
  await writeFile(join(distRoot, 'style.css'), stylesheet);
  await writeFile(join(distRoot, 'theme.js'), theme);
  await writeFile(join(distRoot, 'image-viewer.js'), imageViewer);
  await writeFile(join(distRoot, 'quick-browse.js'), quickBrowse);
  await cp(publicRoot, distRoot, {
    recursive: true,
    filter: (path) => !path.endsWith('.gitkeep')
  });
  await writeFile(join(distRoot, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /write\nDisallow: /api/\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  await writeFile(join(distRoot, 'sitemap.xml'), renderSitemap(posts, siteUrl));
  await writeFile(join(distRoot, 'feed.xml'), renderFeed(posts, {
    name: site.name.trim(),
    description: site.description.trim(),
    lang: site.lang.trim()
  }, siteUrl));

  const htmlSize = Buffer.byteLength(html);
  if (posts.length > 5000 || htmlSize > 5 * 1024 * 1024) {
    console.warn(`Timeline size reached its review threshold: ${posts.length} posts, ${htmlSize} HTML bytes.`);
  }
  console.log(`Built ${posts.length} UTC posts into dist/ (${htmlSize} HTML bytes).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
