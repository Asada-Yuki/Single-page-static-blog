import WRITER_ASSETS from './writer-assets.js';

const SESSION_SECONDS = 180 * 24 * 60 * 60;
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
    ...extraHeaders
  });
  return new Response(JSON.stringify(data), { status, headers });
}

function withWriterHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('Content-Security-Policy', WRITER_CSP);
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
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

async function makeSession(secret) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const signature = await signMessage(`v1:${expires}`, secret);
  return `${expires}.${signature}`;
}

async function hasSession(request, secret) {
  const token = cookieValue(request, '__Host-blog_session');
  const match = token.match(/^(\d{10})\.([A-Za-z0-9_-]{43})$/);
  if (!match) return false;
  const expires = Number(match[1]);
  if (!Number.isSafeInteger(expires) || expires <= Math.floor(Date.now() / 1000)) return false;
  return verifyMessage(`v1:${expires}`, match[2], secret);
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
  const candidate = typeof payload.authorKey === 'string' ? payload.authorKey : '';
  if (candidate.length < 32 || candidate.length > 256) throw new HttpError(401, 'The author key was not accepted.');

  const expectedSignature = await signMessage(`author:${env.AUTHOR_KEY}`, env.AUTHOR_KEY);
  const accepted = await verifyMessage(`author:${candidate}`, expectedSignature, env.AUTHOR_KEY);
  if (!accepted) throw new HttpError(401, 'The author key was not accepted.');

  const token = await makeSession(env.AUTHOR_KEY);
  return json({ authenticated: true }, 200, { 'Set-Cookie': cookieHeader(token, SESSION_SECONDS) });
}

async function handleAttempt(request, env) {
  if (!sameOrigin(request)) throw new HttpError(403, 'Request origin was rejected.');
  assertConfiguration(env);
  if (!await hasSession(request, env.AUTHOR_KEY)) throw new HttpError(401, 'Your session has expired.');
  return json({ id: crypto.randomUUID(), timestamp: new Date().toISOString() });
}

function timestampForFile(date) {
  return date.toISOString().replace(/:/g, '-');
}

function decodeWebp(base64) {
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
  if (binary.slice(0, 4) !== 'RIFF' || binary.slice(8, 12) !== 'WEBP') {
    throw new HttpError(415, 'Uploaded files must be WebP images.');
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

function validatePost(payload) {
  if (!payload || typeof payload.body !== 'string' || payload.body.length > MAX_BODY_CHARS) {
    throw new HttpError(400, 'Post text must be 100,000 characters or less.');
  }
  if (!Array.isArray(payload.images) || payload.images.length > MAX_IMAGES) {
    throw new HttpError(400, 'A post can contain up to five images.');
  }
  if (!payload.body.trim()) throw new HttpError(400, 'Write something or add an image.');

  const imageIds = new Set();
  let totalBytes = 0;
  for (const image of payload.images) {
    if (!image || typeof image.id !== 'string' || !UUID_PATTERN.test(image.id) || imageIds.has(image.id.toLowerCase())) {
      throw new HttpError(400, 'An image reference is invalid.');
    }
    if (image.alt !== undefined && (typeof image.alt !== 'string' || Array.from(image.alt).length > MAX_ALT_CHARS)) {
      throw new HttpError(400, 'Image descriptions must be 250 characters or less.');
    }
    const bytes = decodeWebp(image.data);
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

async function github(path, env, method = 'GET', body) {
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPO)}${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'single-timeline-blog-publisher',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2026-03-10',
      'Content-Type': 'application/json'
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
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
  return data;
}

async function createBlob(content, encoding, env) {
  return github('/git/blobs', env, 'POST', { content, encoding });
}

async function createPost(payload, env) {
  if (!env.GITHUB_OWNER || !env.GITHUB_REPO || !env.GITHUB_BRANCH || !env.GITHUB_TOKEN) {
    throw new HttpError(503, 'GitHub publishing is not configured.');
  }
  const images = validatePost(payload);
  if (typeof payload.attemptId !== 'string' || !UUID_PATTERN.test(payload.attemptId)) {
    throw new HttpError(400, 'The publish attempt is invalid.');
  }
  const createdAt = new Date(payload.timestamp);
  if (Number.isNaN(createdAt.getTime()) || createdAt.toISOString() !== payload.timestamp) {
    throw new HttpError(400, 'The publish timestamp is invalid.');
  }
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
  const treeEntries = [
    ...imageEntries.map((image) => ({ path: image.path, mode: '100644', type: 'blob', sha: image.sha })),
    { path: postPath, mode: '100644', type: 'blob', sha: markdownBlob.sha }
  ];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const branch = encodeURIComponent(env.GITHUB_BRANCH);
    const ref = await github(`/git/ref/heads/${branch}`, env);
    const parent = await github(`/git/commits/${ref.object.sha}`, env);
    const tree = await github('/git/trees', env, 'POST', { base_tree: parent.tree.sha, tree: treeEntries });
    const commit = await github('/git/commits', env, 'POST', {
      message: `post: ${createdAt.toISOString()}`,
      tree: tree.sha,
      parents: [ref.object.sha],
      author: { name: 'site publisher', email: 'publisher@users.noreply.github.com' },
      committer: { name: 'site publisher', email: 'publisher@users.noreply.github.com' }
    });

    try {
      await github(`/git/refs/heads/${branch}`, env, 'PATCH', { sha: commit.sha, force: false });
      return { timestamp: createdAt.toISOString(), commit: commit.sha };
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
  if (!await hasSession(request, env.AUTHOR_KEY)) throw new HttpError(401, 'Your session has expired.');
  const payload = await readRequestJson(request, MAX_REQUEST_BYTES);
  const result = await createPost(payload, env);
  return json({ ok: true, timestamp: result.timestamp, commit: result.commit });
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
  if (error instanceof HttpError) {
    const headers = error.status === 429 ? { 'Retry-After': '60' } : {};
    return json({ error: error.message }, error.status, headers);
  }
  if (error && Number.isInteger(error.status)) {
    if (error.status === 409 || error.status === 422) return json({ error: 'The timeline changed during publishing. Press Publish again.' }, 409);
    console.error('GitHub publishing failed', error.status, error.endpoint, error.githubMessage, error.githubRequestId);
    const detail = [error.endpoint, error.githubMessage, error.acceptedPermissions && `required ${error.acceptedPermissions}`, error.githubRequestId && `GitHub request ${error.githubRequestId}`, error.responseType && `type ${error.responseType}`].filter(Boolean).join('; ');
    return json({ error: `GitHub rejected publishing (${error.status})${detail ? ` at ${detail}` : ''}.` }, 502);
  }
  console.error('Worker request failed.');
  return json({ error: 'Request failed. The draft is still here.' }, 500);
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/api/session' && request.method === 'GET') {
        assertConfiguration(env);
        return json({ authenticated: await hasSession(request, env.AUTHOR_KEY) });
      }
      if (pathname === '/api/login' && request.method === 'POST') return await handleLogin(request, env);
      if (pathname === '/api/attempt' && request.method === 'POST') return await handleAttempt(request, env);
      if (pathname === '/api/logout' && request.method === 'POST') {
        if (!sameOrigin(request)) throw new HttpError(403, 'Request origin was rejected.');
        return json({ ok: true }, 200, { 'Set-Cookie': cookieHeader('', 0) });
      }
      if (pathname === '/api/publish' && request.method === 'POST') return await handlePublish(request, env);
      if (pathname.startsWith('/api/')) return json({ error: 'Not found.' }, 404);
      if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'Method not allowed.' }, 405);
      if (pathname === '/' || pathname === '/write') return await serveWriterAsset(request, env, '/write.html');
      if (WRITER_ASSETS[pathname]) return await serveWriterAsset(request, env, pathname);
      return withWriterHeaders(await env.ASSETS.fetch(request));
    } catch (error) {
      return errorResponse(error);
    }
  }
};
