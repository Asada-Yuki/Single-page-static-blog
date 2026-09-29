import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const root = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(root, 'content');
const publicRoot = join(root, 'public');
const distRoot = join(root, 'dist');
const timestampPattern = /^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z)(?:-[a-f0-9]{8})?\.md$/;

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
  breaks: false
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

function renderTimeline(posts) {
  if (posts.length === 0) {
    return '<p class="timeline-empty" role="status">No entries yet. Dates and times are UTC.</p>';
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
      <article class="entry">
        <time class="entry-time" datetime="${escapeHtml(post.iso)}">${formatUtcTime(post.iso)}</time>
        <div class="entry-content">${md.render(post.body)}</div>
      </article>`).join('\n');
    return `
      <section class="day" aria-label="${formatUtcDate(dateTime)}">
        <time class="day-date" datetime="${date}T00:00:00Z">${formatUtcDate(dateTime)}</time>
        ${renderedEntries}
      </section>`;
  }).join('\n');
}

async function main() {
  const site = JSON.parse(await readFile(join(root, 'site.json'), 'utf8'));
  if (typeof site.name !== 'string' || !site.name.trim()) throw new Error('site.json must contain a non-empty name.');

  const posts = await collectPosts(contentRoot);
  posts.sort((a, b) => b.iso.localeCompare(a.iso) || b.path.localeCompare(a.path));

  const template = await readFile(join(root, 'src', 'template.html'), 'utf8');
  const html = template
    .replaceAll('{{SITE_NAME}}', escapeHtml(site.name.trim()))
    .replace('{{TIMELINE}}', renderTimeline(posts));

  await rm(distRoot, { recursive: true, force: true });
  await mkdir(distRoot, { recursive: true });
  await writeFile(join(distRoot, 'index.html'), html);
  await cp(join(root, 'src', 'style.css'), join(distRoot, 'style.css'));
  await cp(publicRoot, distRoot, {
    recursive: true,
    filter: (path) => !path.endsWith('.gitkeep')
  });

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
