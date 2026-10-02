import WRITER_ASSETS from './writer-assets.js';
import { webpDimensions } from '../../shared/webp.js';
import { snapshotText, sha256, canonicalTimestamp } from '../../shared/publish-protocol.js';

const SESSION_SECONDS = 30 * 24 * 60 * 60;
const MAX_REQUEST_BYTES = 8 * 1024 * 1024;
const MAX_BODY_CHARS = 100_000;
const MAX_ALT_CHARS = 250;
const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 1024 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const IMAGE_MARKER_PATTERN = /\[\[image:([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\]\]/gi;
const WRITER_CSP = "default-src 'self'; img-src 'self' blob:; style-src 'self'; script-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(data, status = 200, extraHeaders = {}) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    ...extraHeaders
  });
  return new Response(JSON.stringify(data), { status, headers });
}

function withWriterHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store, no-transform');
  headers.set('Content-Security-Policy', WRITER_CSP);
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Strict-Transport-Security', 'max-age=86400');
  return new Response(response.body, { status: response.status, headers });
}

function sameOrigin(request) {
  return request.headers.get('Origin') === new URL(request.url).origin;
}

function cookieValue(request, name) {
  const cookies = request.headers.get('Cookie') || '';
  for (const part of cookies.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return value.join('=');
  }
  return '';
}

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signMessage(message, secret) {
  const key = await hmacKey(secret);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)));
  return base64Url(signature);
}

async function verifyMessage(message, signature, secret) {
  try {
    const key = await hmacKey(secret);
    return await crypto.subtle.verify('HMAC', key, fromBase64Url(signature), new TextEncoder().encode(message));
  } catch {
    return false;
  }
}

function sessionSeconds(env) {
  const days = Number(env.SESSION_DAYS || 30);
  return Number.isInteger(days) && days >= 1 && days <= 90 ? days * 86400 : SESSION_SECONDS;
}

async function sessionStore(env, path, data) {
  if (!env.SESSIONS) throw new HttpError(503, 'Session protection is not configured.');
  const store = env.SESSIONS.get(env.SESSIONS.idFromName('author'));
  const response = await store.fetch(`https://session.internal${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
  if (!response.ok) throw new HttpError(503, 'Session protection is temporarily unavailable.');
  return response.json();
}

async function makeSession(env) {
  const expires = Math.floor(Date.now() / 1000) + sessionSeconds(env);
  const id = crypto.randomUUID();
  const signature = await signMessage(`v2:${id}:${expires}`, env.AUTHOR_KEY);
  await sessionStore(env, '/create', { id, expires });
  return `${id}.${expires}.${signature}`;
}

async function hasSession(request, env) {
  const token = cookieValue(request, '__Host-blog_session');
  const match = token.match(/^([0-9a-f-]{36})\.(\d{10})\.([A-Za-z0-9_-]{43})$/);
  if (!match) return false;
  const expires = Number(match[2]);
  if (!Number.isSafeInteger(expires) || expires <= Math.floor(Date.now() / 1000)) return false;
  if (!await verifyMessage(`v2:${match[1]}:${expires}`, match[3], env.AUTHOR_KEY)) return false;
  return (await sessionStore(env, '/check', { id: match[1], expires })).active === true;
}

// One strongly consistent object holds the small author's session ledger.
// It is never exposed as a public API; expired records are removed by an alarm.
export class SessionStore {
  constructor(state, env = {}) { this.state = state; this.env = env; }
  async fetch(request) {
    if (new URL(request.url).pathname === '/validate-webp') {
      try {
        const bytes = await request.arrayBuffer();
        if (bytes.byteLength > MAX_IMAGE_BYTES) return json({}, 413);
        const size = webpDimensions(bytes, 2048 * 2048);
        if (size.width > 2048 || size.height > 2048) return json({}, 400);
        if (!this.env.WEBP_DECODER) return json({}, 503);
        const decoded = await this.env.WEBP_DECODER(bytes);
        return json({ valid: decoded.width === size.width && decoded.height === size.height });
      } catch { return json({ valid: false }, 400); }
    }
    const { id, expires } = await request.json();
    if (!UUID_PATTERN.test(id || '')) return json({ error: 'Invalid session.' }, 400);
    const key = `session:${id}`;
    const path = new URL(request.url).pathname;
    if (path === '/create') {
      if (!Number.isSafeInteger(expires) || expires <= Date.now() / 1000) return json({}, 400);
      await this.state.storage.put(key, expires);
      if (!await this.state.storage.getAlarm()) await this.state.storage.setAlarm(Date.now() + 86400000);
      return json({ ok: true });
    }
    if (path === '/revoke') { await this.state.storage.delete(key); return json({ ok: true }); }
    if (path === '/check') {
      const stored = await this.state.storage.get(key);
      return json({ active: stored === expires && stored > Date.now() / 1000 });
    }
    return json({}, 404);
  }
  async alarm() {
    const sessions = await this.state.storage.list({ prefix: 'session:' });
    const expired = [...sessions].filter(([, expires]) => expires <= Date.now() / 1000).map(([key]) => key);
    if (expired.length) await this.state.storage.delete(expired);
    if (sessions.size > expired.length) await this.state.storage.setAlarm(Date.now() + 86400000);
  }
}

async function readJson(request, maxBytes) {
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > maxBytes) throw new HttpError(413, 'Request is too large.');
  if (!request.body) throw new HttpError(400, 'A JSON request body is required.');

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new HttpError(413, 'Request is too large.');
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, 'The request body is not valid JSON.');
  }
}

async function readRequestJson(request, maxBytes) {
  const contentType = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') throw new HttpError(415, 'Use application/json.');
  return readJson(request, maxBytes);
}

function cookieHeader(token, maxAge) {
  return `__Host-blog_session=${token}; Path=/; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Strict`;
}

function assertConfiguration(env) {
  if (!env.AUTHOR_KEY || env.AUTHOR_KEY.length < 32) {
    throw new HttpError(503, 'The author key is not configured.');
  }
}

async function handleLogin(request, env) {
  if (!sameOrigin(request)) throw new HttpError(403, 'Request origin was rejected.');
  assertConfiguration(env);
  if (!env.AUTHOR_LOGIN_LIMITER || typeof env.AUTHOR_LOGIN_LIMITER.limit !== 'function') {
    throw new HttpError(503, 'Login protection is not configured.');
  }
  let loginAllowance;
  try {
    const clientAddress = request.headers.get('CF-Connecting-IP')?.trim() || 'unknown';
    loginAllowance = await env.AUTHOR_LOGIN_LIMITER.limit({ key: `author-login:${clientAddress}` });
  } catch {
    throw new HttpError(503, 'Login protection is temporarily unavailable.');
  }
  if (!loginAllowance?.success) throw new HttpError(429, 'Too many login attempts. Wait a minute and try again.');

  const payload = await readRequestJson(request, 2048);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new HttpError(400, 'Use a JSON object.');
  const candidate = typeof payload.authorKey === 'string' ? payload.authorKey : '';
  if (candidate.length < 32 || candidate.length > 256) throw new HttpError(401, 'The author key was not accepted.');

  const expectedSignature = await signMessage(`author:${env.AUTHOR_KEY}`, env.AUTHOR_KEY);
  const accepted = await verifyMessage(`author:${candidate}`, expectedSignature, env.AUTHOR_KEY);
  if (!accepted) throw new HttpError(401, 'The author key was not accepted.');

  const token = await makeSession(env);
  return json({ authenticated: true }, 200, { 'Set-Cookie': cookieHeader(token, sessionSeconds(env)) });
}

async function handleAttempt(request, env) {
  if (!sameOrigin(request)) throw new HttpError(403, 'Request origin was rejected.');
  assertConfiguration(env);
  if (!await hasSession(request, env)) throw new HttpError(401, 'Your session has expired.');
  const payload = await readRequestJson(request, 2048);
  if (!payload || !/^[a-f0-9]{64}$/.test(payload.snapshotHash || '')) throw new HttpError(400, 'The draft snapshot is invalid.');
  const attempt = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), snapshotHash: payload.snapshotHash };
  attempt.signature = await signMessage(`attempt:${attempt.id}:${attempt.timestamp}:${attempt.snapshotHash}`, env.AUTHOR_KEY);
  return json(attempt);
}

function timestampForFile(date) {
  return date.toISOString().replace(/:/g, '-');
}

async function decodeWebp(base64, env) {
  if (typeof base64 !== 'string' || !base64.length || base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new HttpError(400, 'An uploaded image is invalid.');
  }
  let binary;
  try {
    binary = atob(base64);
  } catch {
    throw new HttpError(400, 'An uploaded image is invalid.');
  }
  if (!binary.length || binary.length > MAX_IMAGE_BYTES) throw new HttpError(413, 'Each WebP image must be 1 MB or smaller.');
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  try {
    const dimensions = webpDimensions(bytes, 2048 * 2048);
    if (dimensions.width > 2048 || dimensions.height > 2048) throw new Error('Use images up to 2048 pixels per side.');
    if (!env.SESSIONS) throw new HttpError(503, 'Image validation is not configured.');
    const response = await env.SESSIONS.get(env.SESSIONS.idFromName('author')).fetch('https://session.internal/validate-webp', { method: 'POST', body: bytes });
    if (response.status === 503) throw new HttpError(503, 'Image validation is temporarily unavailable.');
    if (!response.ok || (await response.json()).valid !== true) throw new Error('The image is damaged.');
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'The WebP image is damaged, unsupported, or too large.');
  }
  return binary.length;
}

function escapeMarkdownAlt(value) {
  return String(value)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .trim();
}

async function validatePost(payload, env) {
  if (!payload || typeof payload.body !== 'string' || payload.body.length > MAX_BODY_CHARS) {
    throw new HttpError(400, 'Post text must be 100,000 characters or less.');
  }
  if (!Array.isArray(payload.images) || payload.images.length > MAX_IMAGES) {
    throw new HttpError(400, 'A post can contain up to five images.');
  }
  if (!payload.body.trim()) throw new HttpError(400, 'Write something or add an image.');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(payload.body) || !payload.body.isWellFormed()) {
    throw new HttpError(400, 'The post contains an unsupported control character.');
  }

  const imageIds = new Set();
  let totalBytes = 0;
  for (const image of payload.images) {
    if (!image || typeof image.id !== 'string' || !UUID_PATTERN.test(image.id) || imageIds.has(image.id.toLowerCase())) {
      throw new HttpError(400, 'An image reference is invalid.');
    }
    if (image.alt !== undefined && (typeof image.alt !== 'string' || Array.from(image.alt).length > MAX_ALT_CHARS)) {
      throw new HttpError(400, 'Image descriptions must be 250 characters or less.');
    }
    if (typeof image.alt === 'string' && (!image.alt.isWellFormed() || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(image.alt))) {
      throw new HttpError(400, 'The image description contains an unsupported character.');
    }
    const bytes = await decodeWebp(image.data, env);
    totalBytes += bytes;
    imageIds.add(image.id.toLowerCase());
  }
  if (totalBytes > MAX_IMAGES * MAX_IMAGE_BYTES) throw new HttpError(413, 'The combined images are too large.');

  const markers = [...payload.body.matchAll(IMAGE_MARKER_PATTERN)].map((match) => match[1].toLowerCase());
  const residue = payload.body.replace(IMAGE_MARKER_PATTERN, '');
  if (residue.includes('[[image:')) throw new HttpError(400, 'An image placeholder is invalid.');
  const referenced = new Set(markers);
  if (markers.some((id) => !imageIds.has(id)) || [...imageIds].some((id) => !referenced.has(id))) {
    throw new HttpError(400, 'An image in the post is missing.');
  }
  return payload.images;
}

async function github(path, env, method = 'GET', body, allowMissing = false) {
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPO)}${path}`, {
    method,
    signal: AbortSignal.timeout(15000),
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'single-timeline-blog-publisher',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2026-03-10',
      'Content-Type': 'application/json'
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (response.status === 404 && allowMissing) return null;
  const responseText = await response.text();
  let data = {};
  try {
    data = JSON.parse(responseText);
  } catch {
    // Some upstream errors return plain text or HTML instead of JSON.
  }
  if (!response.ok) {
    const error = new Error('GitHub API request failed.');
    error.status = response.status;
    error.endpoint = `${method} ${path}`;
    const reason = typeof data.message === 'string' ? data.message :
      typeof data.error === 'string' ? data.error : responseText;
    error.githubMessage = reason.replaceAll(env.GITHUB_TOKEN, '[redacted]').replace(/\s+/g, ' ').slice(0, 180);
    error.githubRequestId = response.headers.get('x-github-request-id') || '';
    error.acceptedPermissions = response.headers.get('x-accepted-github-permissions') || '';
    error.responseType = response.headers.get('content-type') || '';
    throw error;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)
    || !(response.headers.get('content-type') || '').includes('application/json')) {
    throw new HttpError(502, 'GitHub returned an unexpected response. Retry safely.');
  }
  return data;
}

async function createBlob(content, encoding, env) {
  const blob = await github('/git/blobs', env, 'POST', { content, encoding });
  assertSha(blob.sha);
  return blob;
}

function assertSha(value) {
  if (typeof value !== 'string' || !/^[a-f0-9]{40}$/.test(value)) throw new HttpError(502, 'GitHub returned invalid commit data. Retry safely.');
}

async function createPost(payload, env) {
  if (!env.GITHUB_OWNER || !env.GITHUB_REPO || !env.GITHUB_BRANCH || !env.GITHUB_TOKEN) {
    throw new HttpError(503, 'GitHub publishing is not configured.');
  }
  const images = await validatePost(payload, env);
  if (typeof payload.attemptId !== 'string' || !UUID_PATTERN.test(payload.attemptId)) {
    throw new HttpError(400, 'The publish attempt is invalid.');
  }
  if (!canonicalTimestamp(payload.timestamp)) {
    throw new HttpError(400, 'The publish timestamp is invalid.');
  }
  const snapshotHash = await sha256(snapshotText(payload.body, images));
  if (snapshotHash !== payload.snapshotHash) throw new HttpError(409, 'The draft changed. Start a new publish attempt.');
  if (!await verifyMessage(`attempt:${payload.attemptId}:${payload.timestamp}:${snapshotHash}`, payload.signature, env.AUTHOR_KEY)) {
    throw new HttpError(400, 'The publish attempt was not issued by this site.');
  }
  const createdAt = new Date(payload.timestamp);
  const timestamp = timestampForFile(createdAt);
  const folder = `${createdAt.getUTCFullYear()}/${String(createdAt.getUTCMonth() + 1).padStart(2, '0')}`;
  const suffix = payload.attemptId.replaceAll('-', '').toLowerCase();

  const imageEntries = [];
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const filename = `${timestamp}-${suffix}-${index + 1}.webp`;
    const blob = await createBlob(image.data, 'base64', env);
    imageEntries.push({
      id: image.id.toLowerCase(),
      alt: typeof image.alt === 'string' ? image.alt : 'Photo',
      path: `public/images/${folder}/${filename}`,
      publicPath: `/images/${folder}/${filename}`,
      sha: blob.sha
    });
  }

  const imagesById = new Map(imageEntries.map((image) => [image.id, image]));
  const markdown = payload.body.replace(IMAGE_MARKER_PATTERN, (_match, id) => {
    const image = imagesById.get(id.toLowerCase());
    const description = escapeMarkdownAlt(image.alt || '图片');
    return `![${description}](${image.publicPath})`;
  });
  const postPath = `content/${folder}/${timestamp}-${suffix}.md`;
  const markdownBlob = await createBlob(markdown, 'utf-8', env);
  const bodyHash = await sha256(markdown);
  const key = `${timestamp}-${suffix}`;
  const result = (commit, alreadyPublished = false) => ({ timestamp: payload.timestamp, commit,
    attemptId: payload.attemptId, snapshotHash, bodyHash, key, permalink: `/p/${key}/`, alreadyPublished });
  const treeEntries = [
    ...imageEntries.map((image) => ({ path: image.path, mode: '100644', type: 'blob', sha: image.sha })),
    { path: postPath, mode: '100644', type: 'blob', sha: markdownBlob.sha }
  ];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const branch = encodeURIComponent(env.GITHUB_BRANCH);
    const ref = await github(`/git/ref/heads/${branch}`, env);
    assertSha(ref.object?.sha);
    const parent = await github(`/git/commits/${ref.object.sha}`, env);
    assertSha(parent.tree?.sha);
    // Read at the exact parent revision. A branch rebase repeats this check,
    // so a response lost after committing can never overwrite an older post.
    const fileAtParent = (path) => github(`/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${ref.object.sha}`, env, 'GET', undefined, true);
    const existingPost = await fileAtParent(postPath);
    if (existingPost) {
      if (existingPost.sha !== markdownBlob.sha) throw new HttpError(409, 'This publish attempt already contains different text. Start a new attempt.');
      for (const image of imageEntries) {
        const existing = await fileAtParent(image.path);
        if (existing?.sha !== image.sha) throw new HttpError(409, 'This publish attempt already contains different images. Start a new attempt.');
      }
      return result(ref.object.sha, true);
    }
    for (const image of imageEntries) {
      if (await fileAtParent(image.path)) throw new HttpError(409, 'An image path already exists. Start a new attempt.');
    }
    const tree = await github('/git/trees', env, 'POST', { base_tree: parent.tree.sha, tree: treeEntries });
    assertSha(tree.sha);
    const commit = await github('/git/commits', env, 'POST', {
      message: `post: ${createdAt.toISOString()}`,
      tree: tree.sha,
      parents: [ref.object.sha],
      author: { name: 'site publisher', email: 'publisher@users.noreply.github.com' },
      committer: { name: 'site publisher', email: 'publisher@users.noreply.github.com' }
    });
    assertSha(commit.sha);
    try {
      const updated = await github(`/git/refs/heads/${branch}`, env, 'PATCH', { sha: commit.sha, force: false });
      if (updated.object?.sha !== commit.sha) throw new HttpError(502, 'GitHub did not confirm the branch update. Retry safely.');
      return result(commit.sha);
    } catch (error) {
      if (attempt === 0 && (error.status === 409 || error.status === 422)) continue;
      if (error.status === 409 || error.status === 422) throw new HttpError(409, 'The timeline changed during publishing. Press Publish again.');
      throw error;
    }
  }
  throw new HttpError(409, 'The timeline changed during publishing. Press Publish again.');
}

async function handlePublish(request, env) {
  if (!sameOrigin(request)) throw new HttpError(403, 'Request origin was rejected.');
  assertConfiguration(env);
  if (!await hasSession(request, env)) throw new HttpError(401, 'Your session has expired.');
  if (!env.AUTHOR_PUBLISH_LIMITER) throw new HttpError(503, 'Publish protection is not configured.');
  const allowance = await env.AUTHOR_PUBLISH_LIMITER.limit({ key: 'author-publish' });
  if (!allowance?.success) throw new HttpError(429, 'Too many publish attempts. Wait a minute.');
  const payload = await readRequestJson(request, MAX_REQUEST_BYTES);
  const result = await createPost(payload, env);
  return json({ ok: true, ...result });
}

async function serveWriterAsset(request, env, pathname) {
  const embeddedAsset = WRITER_ASSETS[pathname];
  if (embeddedAsset) {
    const body = request.method === 'HEAD' ? null : embeddedAsset.body;
    const response = new Response(body, {
      headers: { 'Content-Type': embeddedAsset.contentType }
    });
    return withWriterHeaders(response);
  }

  const url = new URL(request.url);
  url.pathname = pathname;
  const assetRequest = new Request(url, request);
  return withWriterHeaders(await env.ASSETS.fetch(assetRequest));
}

function errorResponse(error) {
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return json({ error: 'Publishing timed out. Retry safely with the same draft.' }, 504);
  if (error instanceof HttpError) {
    const headers = error.status === 429 ? { 'Retry-After': '60' } : {};
    return json({ error: error.message }, error.status, headers);
  }
  if (error && Number.isInteger(error.status)) {
    if (error.status === 409 || error.status === 422) return json({ error: 'The timeline changed during publishing. Press Publish again.' }, 409);
    console.error('GitHub publishing failed', error.status, error.endpoint, error.githubMessage, error.githubRequestId);
    return json({ error: `GitHub could not confirm publishing (${error.status}). Retry with this draft; it will not be duplicated.` }, 502);
  }
  console.error('Worker request failed.');
  return json({ error: 'Request failed. The draft is still here.' }, 500);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    try {
      if (url.hostname === 'www.yuki.art') {
        url.hostname = 'yuki.art';
        return new Response(null, { status: 308, headers: { Location: url.href, 'Cache-Control': 'no-store' } });
      }
      if (pathname === '/api/session' && request.method === 'GET') {
        assertConfiguration(env);
        return json({ authenticated: await hasSession(request, env) });
      }
      if (pathname === '/api/login' && request.method === 'POST') return await handleLogin(request, env);
      if (pathname === '/api/attempt' && request.method === 'POST') return await handleAttempt(request, env);
      if (pathname === '/api/logout' && request.method === 'POST') {
        if (!sameOrigin(request)) throw new HttpError(403, 'Request origin was rejected.');
        assertConfiguration(env);
        if (await hasSession(request, env)) {
          const id = cookieValue(request, '__Host-blog_session').split('.')[0];
          await sessionStore(env, '/revoke', { id });
        }
        return json({ ok: true }, 200, { 'Set-Cookie': cookieHeader('', 0) });
      }
      if (pathname === '/api/publish' && request.method === 'POST') return await handlePublish(request, env);
      if (pathname.startsWith('/api/')) return json({ error: 'Not found.' }, 404);
      if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'Method not allowed.' }, 405);
      if (pathname === '/write/' || pathname === '/write.html') {
        return withWriterHeaders(new Response(null, { status: 308, headers: { Location: '/write' } }));
      }
      if (pathname === '/' || pathname === '/write') return await serveWriterAsset(request, env, '/write.html');
      if (WRITER_ASSETS[pathname]) return await serveWriterAsset(request, env, pathname);
      return withWriterHeaders(await env.ASSETS.fetch(request));
    } catch (error) {
      return errorResponse(error);
    }
  }
};
