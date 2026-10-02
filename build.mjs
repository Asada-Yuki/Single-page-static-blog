import { createHash } from 'node:crypto';
import { access, cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';
import { validateWebp } from './shared/webp-node.mjs';

const sourceRoot = dirname(fileURLToPath(import.meta.url));
const root = process.env.YUKI_BUILD_ROOT || sourceRoot;
const contentRoot = join(root, 'content');
const publicRoot = join(root, 'public');
const distRoot = join(root, 'dist');
const timestampPattern = /^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z)(?:-[a-f0-9]{8}|-[a-f0-9]{32})?\.md$/;
const imageInfo = new Map();
const CHUNK_SIZE = 12;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function escapeXml(value) {
  return escapeHtml(String(value).replace(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/gu, ''));
}

function articleText(body) {
  return md.parse(body, {}).filter((token) => ['inline', 'fence', 'code_block'].includes(token.type))
    .map((token) => token.children ? inlineText(token.children) : token.content).join('\n').trim();
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
md.enable('linkify');

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
  const dimensions = imageInfo.get(src);
  if (!dimensions) throw new Error(`Missing or invalid image: ${src}`);
  token.attrSet('width', String(dimensions.width));
  token.attrSet('height', String(dimensions.height));
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
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (placeholder, key) => {
    if (!Object.hasOwn(values, key)) throw new Error(`${name} contains an unresolved template value: ${placeholder}`);
    return String(values[key]);
  });
}

function entryId(post) {
  return `entry-${post.path.replace(/\.md$/, '').replace(/[^A-Za-z0-9_-]+/g, '-')}`;
}

function postKey(post) {
  return basename(post.path, '.md');
}

function postPath(post) {
  return `/p/${encodeURIComponent(postKey(post))}/`;
}

function postUrl(post, siteUrl) {
  return `${siteUrl}${postPath(post)}`;
}

function inlineText(tokens = []) {
  return tokens.map((token) => {
    if (token.type === 'text' || token.type === 'code_inline') return token.content;
    if (token.type === 'image') return token.content || '';
    if (token.type === 'softbreak' || token.type === 'hardbreak') return ' ';
    if (token.children?.length) return inlineText(token.children);
    return '';
  }).join('');
}

function cleanShareText(value) {
  return value
    .replace(/https?:\/\/\S+/gu, '')
    .replace(/[\u0000-\u001f\u007f]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function truncateCodePoints(value, limit) {
  const characters = Array.from(value);
  return characters.length > limit
    ? `${characters.slice(0, limit).join('').trimEnd()}…`
    : value;
}

async function shareMetadata(post, site, siteUrl) {
  const tokens = md.parse(post.body, {});
  const contentBlocks = [];
  const images = [];
  let hasVideo = false;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type === 'video_embed') hasVideo = true;
    if (token.type !== 'inline') continue;

    const text = cleanShareText(inlineText(token.children));
    if (text) contentBlocks.push({ text, tokenIndex: index });

    for (const child of token.children || []) {
      if (child.type !== 'image') continue;
      const src = child.attrGet('src') || '';
      const alt = cleanShareText(child.content || inlineText(child.children));
      if (!/^\/images\/\d{4}\/\d{2}\/[A-Za-z0-9._-]+\.webp$/.test(src)) continue;
      try {
        await access(join(publicRoot, src.slice(1)));
        images.push({ src, alt });
      } catch {
        // An absent image is not advertised to link preview crawlers.
      }
    }
  }

  let heading = '';
  for (let index = 0; index < tokens.length - 1; index += 1) {
    if (!/^heading_open$/.test(tokens[index].type) || tokens[index + 1].type !== 'inline') continue;
    heading = cleanShareText(inlineText(tokens[index + 1].children));
    if (heading) break;
  }

  const firstText = contentBlocks[0]?.text || '';
  const fallbackTime = `${post.iso.slice(0, 10)} ${formatUtcTime(post.iso)}`;
  const fallbackKind = images.length ? '图片记录' : hasVideo ? '视频记录' : '媒体记录';
  const title = truncateCodePoints(heading || firstText || `${fallbackKind} · ${fallbackTime}`, 48);
  const description = truncateCodePoints(
    contentBlocks.map((block) => block.text).join(' ') || images.find((image) => image.alt)?.alt || `${fallbackKind} · ${fallbackTime}`,
    200
  );
  const image = images[0];
  const imageUrl = image ? `${siteUrl}${image.src}` : `${siteUrl}/social-card.png`;
  const imageAlt = image?.alt || (image ? `${site.name} 的内容图片` : `${site.name} 的个人时间流预览`);

  return {
    title,
    description,
    imageUrl,
    imageAlt,
    cardType: image ? 'summary_large_image' : 'summary',
    publishedTime: post.iso
  };
}

function previewText(body) {
  const plainText = body
    .replace(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/gu, '')
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

function renderTimeline(posts, siteUrl) {
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
    const renderedEntries = entries.map((post) => {
      const key = postKey(post);
      const canonicalPath = postPath(post);
      const canonicalUrl = `${siteUrl}${canonicalPath}`;
      const dateTime = `${formatUtcShortDate(post.iso)} · ${formatUtcTime(post.iso)}`;
      const title = post.metadata?.title || previewText(post.body);
      return `
      <article class="entry" id="${entryId(post)}" data-post-key="${escapeHtml(key)}" data-date="${post.iso.slice(0, 10)}" aria-label="${escapeHtml(title)}">
        <div class="entry-toolbar">
          <a class="entry-time entry-permalink" href="${escapeHtml(canonicalPath)}" aria-label="打开这条内容的永久链接，${escapeHtml(dateTime)}">
            <time lang="en" datetime="${escapeHtml(post.iso)}">${formatUtcTime(post.iso)}</time>
          </a>
          <button class="entry-share" type="button" data-share-url="${escapeHtml(canonicalUrl)}" data-share-title="${escapeHtml(title)}" aria-label="分享这条内容，${escapeHtml(dateTime)}" title="分享这条内容" hidden>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.2 11 7.6-3.8m-7.6 5.8 7.6 3.8" /><circle cx="6" cy="12" r="2.25" fill="currentColor" /><circle cx="18" cy="6" r="2.25" fill="currentColor" /><circle cx="18" cy="18" r="2.25" fill="currentColor" /></svg>
          </button>
        </div>
        <div class="entry-share-fallback" data-share-fallback hidden>
          <label><span>这条内容的永久链接</span><input type="text" value="${escapeHtml(canonicalUrl)}" readonly></label>
          <button type="button" data-share-close>关闭</button>
        </div>
        <div class="entry-content">${md.render(post.body)}</div>
      </article>`;
    }).join('\n');
    return `
      <section class="day" data-date="${date}" aria-label="${formatUtcDate(dateTime)}">
      <time class="day-date" lang="en" datetime="${date}T00:00:00Z">${formatUtcDate(dateTime)}</time>
        ${renderedEntries}
      </section>`;
  }).join('\n');
}

function renderFeed(posts, site, siteUrl) {
  const items = posts.slice(0, 20).map((post) => {
    const link = postUrl(post, siteUrl);
    const legacyGuid = `${siteUrl}/#${entryId(post)}`;
    const title = `${post.iso.slice(0, 10)} · ${formatUtcTime(post.iso)}`;
    return `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(legacyGuid)}</guid>
      <pubDate>${new Date(post.iso).toUTCString()}</pubDate>
      <description>${escapeXml(previewText(post.body))}</description>
    </item>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <link>${escapeXml(`${siteUrl}/`)}</link>
    <description>${escapeXml(site.description)}</description>
    <language>${escapeXml(site.lang)}</language>${items}
  </channel>
</rss>
`;
}

function renderSitemap(posts, siteUrl) {
  const lastModified = posts[0] ? `\n    <lastmod>${posts[0].iso}</lastmod>` : '';
  const postUrls = posts.map((post) => `
  <url>
    <loc>${escapeHtml(postUrl(post, siteUrl))}</loc>
  </url>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeHtml(`${siteUrl}/`)}</loc>${lastModified}
  </url><url><loc>${escapeHtml(`${siteUrl}/about/`)}</loc></url>${postUrls}
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

  // Validate each referenced image once, then reserve its exact aspect ratio.
  for (const post of posts) {
    for (const token of md.parse(post.body, {})) {
      for (const child of token.children || []) {
        if (child.type !== 'image') continue;
        const src = child.attrGet('src') || '';
        if (!/^\/images\/\d{4}\/\d{2}\/[A-Za-z0-9._-]+\.webp$/.test(src) || imageInfo.has(src)) continue;
        try { imageInfo.set(src, await validateWebp(await readFile(join(publicRoot, src.slice(1))))); }
        catch (error) { throw new Error(`Invalid image in ${post.path}: ${src}. ${error.message}`); }
      }
    }
    post.metadata = await shareMetadata(post, site, siteUrl);
  }
  const template = await readFile(join(root, 'src', 'template.html'), 'utf8');
  const notFoundTemplate = await readFile(join(root, 'src', '404.html'), 'utf8');
  const assetNames = ['style.css', 'theme.js', 'image-viewer.js', 'quick-browse.js', 'post-sharing.js', 'timeline.js'];
  const assets = Object.fromEntries(await Promise.all(assetNames.map(async (name) => [name, await readFile(join(root, 'src', name), 'utf8')])));
  const versionOf = (content) => createHash('sha256').update(content).digest('hex').slice(0, 12);
  const stylesheet = assets['style.css'];
  const siteName = escapeHtml(site.name.trim());
  const siteDescription = escapeHtml(site.description.trim());
  const siteLang = escapeHtml(site.lang.trim());
  const revision = versionOf(JSON.stringify({ site, posts: posts.map((p) => [p.path, p.body]), assets, images: [...imageInfo] }) + await readFile(new URL('./build.mjs', import.meta.url), 'utf8'));
  const indexPath = `/timeline/index-${revision}.json`;
  const author = { '@type': 'Person', '@id': `${siteUrl}/#author`, name: site.name.trim(), url: `${siteUrl}/about/`, sameAs: ['https://x.com/AsadaYuki_Art'] };
  const jsonLd = (value) => `<script type="application/ld+json">${JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')}</script>`;
  const templateValues = {
    SITE_NAME: siteName,
    SITE_DESCRIPTION: siteDescription,
    SITE_LANG: siteLang,
    SITE_URL: escapeHtml(siteUrl),
    YEAR: String(new Date().getUTCFullYear()),
    STYLE_VERSION: versionOf(stylesheet),
    THEME_VERSION: versionOf(assets['theme.js']),
    IMAGE_VIEWER_VERSION: versionOf(assets['image-viewer.js']),
    QUICK_BROWSE_VERSION: versionOf(assets['quick-browse.js']),
    POST_SHARING_VERSION: versionOf(assets['post-sharing.js']),
    TIMELINE_VERSION: versionOf(assets['timeline.js']),
    TIMELINE_INDEX: indexPath,
    QUICK_BROWSE: renderQuickBrowse(posts),
    TIMELINE: renderTimeline(posts.slice(0, CHUNK_SIZE), siteUrl)
  };
  const homeValues = {
    ...templateValues,
    PAGE_TITLE: `${siteName} · 个人时间流`,
    PAGE_DESCRIPTION: siteDescription,
    CANONICAL_URL: `${escapeHtml(siteUrl)}/`,
    OG_TYPE: 'website',
    OG_TITLE: `${siteName} · 个人时间流`,
    OG_DESCRIPTION: siteDescription,
    OG_URL: `${escapeHtml(siteUrl)}/`,
    OG_IMAGE: `${escapeHtml(siteUrl)}/social-card.png`,
    OG_IMAGE_ALT: `${siteName} 的个人时间流首页预览`,
    TWITTER_CARD: 'summary',
    TWITTER_TITLE: `${siteName} · 个人时间流`,
    TWITTER_DESCRIPTION: siteDescription,
    TWITTER_IMAGE: `${escapeHtml(siteUrl)}/social-card.png`,
    TWITTER_IMAGE_ALT: `${siteName} 的个人时间流首页预览`,
    ARTICLE_META: '',
    INITIAL_ENTRY_ID: '',
    BODY_CLASS: '',
    CONTEXT_LINKS: '',
    STRUCTURED_DATA: jsonLd({ '@context': 'https://schema.org', '@graph': [author, { '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: `${siteUrl}/`, name: site.name.trim(), inLanguage: site.lang, author: { '@id': author['@id'] } }] })
  };
  const html = fillTemplate(template, homeValues, 'src/template.html');
  const notFoundHtml = fillTemplate(notFoundTemplate, templateValues, 'src/404.html');

  await rm(distRoot, { recursive: true, force: true });
  await mkdir(distRoot, { recursive: true });
  await writeFile(join(distRoot, 'index.html'), html);
  await writeFile(join(distRoot, '404.html'), notFoundHtml);
  for (const [name, content] of Object.entries(assets)) await writeFile(join(distRoot, name), content);
  await cp(publicRoot, distRoot, {
    recursive: true,
    filter: (path) => !path.endsWith('.gitkeep')
  });

  const usedPostKeys = new Set();
  let sharePageBytes = 0;
  for (const [postIndex, post] of posts.entries()) {
    const key = postKey(post);
    if (usedPostKeys.has(key)) throw new Error(`Duplicate post key: ${key}`);
    usedPostKeys.add(key);

    const metadata = post.metadata;
    const canonicalUrl = postUrl(post, siteUrl);
    const sharePageValues = {
      ...homeValues,
      PAGE_TITLE: `${escapeHtml(metadata.title)} · ${siteName}`,
      PAGE_DESCRIPTION: escapeHtml(metadata.description),
      CANONICAL_URL: escapeHtml(canonicalUrl),
      OG_TYPE: 'article',
      OG_TITLE: escapeHtml(metadata.title),
      OG_DESCRIPTION: escapeHtml(metadata.description),
      OG_URL: escapeHtml(canonicalUrl),
      OG_IMAGE: escapeHtml(metadata.imageUrl),
      OG_IMAGE_ALT: escapeHtml(metadata.imageAlt),
      TWITTER_CARD: metadata.cardType,
      TWITTER_TITLE: escapeHtml(metadata.title),
      TWITTER_DESCRIPTION: escapeHtml(metadata.description),
      TWITTER_IMAGE: escapeHtml(metadata.imageUrl),
      TWITTER_IMAGE_ALT: escapeHtml(metadata.imageAlt),
      ARTICLE_META: `<meta property="article:published_time" content="${escapeHtml(metadata.publishedTime)}">`,
      INITIAL_ENTRY_ID: escapeHtml(entryId(post)),
      BODY_CLASS: 'shared-page',
      TIMELINE: renderTimeline([post], siteUrl),
      QUICK_BROWSE: renderQuickBrowse(posts.slice(Math.max(0, postIndex - 3), postIndex + 5)),
      CONTEXT_LINKS: `<noscript><nav class="context-links" aria-label="相邻内容">${[posts[postIndex - 1], posts[postIndex + 1]].filter(Boolean).map((p) => `<a href="${postPath(p)}">${escapeHtml(p.metadata.title)}</a>`).join(' · ')}</nav></noscript>`,
      STRUCTURED_DATA: jsonLd({ '@context': 'https://schema.org', '@type': 'SocialMediaPosting', '@id': `${canonicalUrl}#post`, url: canonicalUrl, headline: metadata.title, description: metadata.description, articleBody: articleText(post.body), datePublished: post.iso, inLanguage: site.lang, image: metadata.imageUrl, author, mainEntityOfPage: canonicalUrl })
    };
    const sharePage = fillTemplate(template, sharePageValues, `share page ${key}`);
    const outputPath = join(distRoot, 'p', key, 'index.html');
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, sharePage);
    sharePageBytes += Buffer.byteLength(sharePage);
    await writeFile(join(dirname(outputPath), 'status.json'), JSON.stringify({ key, timestamp: post.iso, bodyHash: createHash('sha256').update(post.body).digest('hex') }));
  }

  await writeFile(join(distRoot, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /write\nDisallow: /api/\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  await writeFile(join(distRoot, 'sitemap.xml'), renderSitemap(posts, siteUrl));
  await writeFile(join(distRoot, 'feed.xml'), renderFeed(posts, {
    name: site.name.trim(),
    description: site.description.trim(),
    lang: site.lang.trim()
  }, siteUrl));

  await mkdir(join(distRoot, 'timeline'), { recursive: true });
  const index = { revision, chunkSize: CHUNK_SIZE, chunks: [], entries: posts.map((post, order) => ({
    key: postKey(post), id: entryId(post), url: postPath(post), iso: post.iso,
    date: formatUtcShortDate(post.iso), time: formatUtcTime(post.iso).replace(' UTC', ''),
    preview: previewText(post.body), order, chunk: Math.floor(order / CHUNK_SIZE)
  })) };
  for (let start = 0; start < posts.length; start += CHUNK_SIZE) {
    const path = `/timeline/chunk-${start / CHUNK_SIZE}-${revision}.json`;
    index.chunks.push(path);
    await writeFile(join(distRoot, path.slice(1)), JSON.stringify({ revision,
      entries: posts.slice(start, start + CHUNK_SIZE).map((post) => ({ key: postKey(post), html: renderTimeline([post], siteUrl) })) }));
  }
  await writeFile(join(distRoot, indexPath.slice(1)), JSON.stringify(index));
  await writeFile(join(distRoot, 'deployment.json'), JSON.stringify({ revision, commit: process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || null, posts: posts.length }));
  const about = fillTemplate(notFoundTemplate, templateValues, 'about template')
    .replace('<meta name="robots" content="noindex, nofollow, noarchive">', '')
    .replace('<title>404 ·', '<title>关于 ·')
    .replace('<p class="not-found__code">404</p>', '<p class="not-found__code">ASADA YUKI</p>')
    .replace('<h1>页面不存在</h1>', '<h1>关于这条时间流</h1>')
    .replace('<p>这条地址可能已更改或不存在。</p>', '<p>我是 Asada Yuki。这里记录文字、图片和日常，所有时间均为 UTC。</p><p><a href="https://x.com/AsadaYuki_Art" rel="me noopener noreferrer">@AsadaYuki_Art</a></p><p>访问统计使用 Cloudflare Web Analytics。没有评论或读者登录。</p>')
    .replace('</head>', `<link rel="canonical" href="${siteUrl}/about/"></head>`);
  await mkdir(join(distRoot, 'about'), { recursive: true });
  await writeFile(join(distRoot, 'about/index.html'), about);
  const walkOutput = async (path) => {
    let bytes = 0; let files = 0;
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const target = join(path, entry.name);
      if (entry.isDirectory()) { const result = await walkOutput(target); bytes += result.bytes; files += result.files; }
      else { const size = (await readFile(target)).byteLength; if (size > 25 * 1024 * 1024) throw new Error(`Asset exceeds 25 MiB: ${target}`); bytes += size; files += 1; }
    }
    return { bytes, files };
  };
  const output = await walkOutput(distRoot);
  if (output.files > 19000 || output.bytes > 200 * 1024 * 1024) throw new Error('Site output exceeds the project budget. Review before deploying.');
  const htmlSize = Buffer.byteLength(html);
  console.log(`Built ${posts.length} UTC posts and share pages (${htmlSize} home bytes, ${sharePageBytes} share HTML bytes, ${output.bytes} output bytes, ${output.files} files).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
