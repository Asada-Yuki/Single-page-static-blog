import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index.js';

const origin = 'https://blog.example';
const env = {
  AUTHOR_KEY: 'a'.repeat(64),
  GITHUB_OWNER: 'Asada-Yuki',
  GITHUB_REPO: 'Single-page-static-blog',
  GITHUB_BRANCH: 'main',
  GITHUB_TOKEN: 'test-token-value',
  ASSETS: {
    fetch: async () => new Response('<!doctype html><title>Write</title>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }
};

function makeRequest(path, { method = 'GET', body, requestOrigin = origin, cookie } = {}) {
  const headers = {};
  if (requestOrigin) headers.Origin = requestOrigin;
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return new Request(`${origin}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
}

test('writer headers, origin checks, session cookie, and GitHub publishing', async () => {
  const writerPage = await worker.fetch(makeRequest('/write'), env);
  assert.equal(writerPage.status, 200);
  assert.match(writerPage.headers.get('Content-Security-Policy'), /default-src 'self'/);
  assert.equal(writerPage.headers.get('X-Robots-Tag'), 'noindex, nofollow, noarchive');
  assert.equal(writerPage.headers.get('Permissions-Policy'), 'camera=(), microphone=(), geolocation=()');
  assert.equal(writerPage.headers.get('Cache-Control'), 'no-store');

  const foreignOriginLogin = await worker.fetch(makeRequest('/api/login', {
    method: 'POST',
    requestOrigin: 'https://attacker.example',
    body: { authorKey: env.AUTHOR_KEY }
  }), env);
  assert.equal(foreignOriginLogin.status, 403);

  const wrongKeyLogin = await worker.fetch(makeRequest('/api/login', {
    method: 'POST',
    body: { authorKey: 'b'.repeat(64) }
  }), env);
  assert.equal(wrongKeyLogin.status, 401);

  const login = await worker.fetch(makeRequest('/api/login', {
    method: 'POST',
    body: { authorKey: env.AUTHOR_KEY }
  }), env);
  assert.equal(login.status, 200);
  const setCookie = login.headers.get('Set-Cookie');
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /SameSite=Strict/);
  const cookie = setCookie.split(';', 1)[0];

  const session = await worker.fetch(makeRequest('/api/session', { cookie }), env);
  assert.deepEqual(await session.json(), { authenticated: true });

  let githubCalls = 0;
  const unauthenticatedPublish = await worker.fetch(makeRequest('/api/publish', {
    method: 'POST',
    body: { body: 'private', images: [] }
  }), env);
  assert.equal(unauthenticatedPublish.status, 401);
  assert.equal(githubCalls, 0);

  const crossOriginPublish = await worker.fetch(makeRequest('/api/publish', {
    method: 'POST',
    requestOrigin: 'https://attacker.example',
    cookie,
    body: { body: 'private', images: [] }
  }), env);
  assert.equal(crossOriginPublish.status, 403);
  assert.equal(githubCalls, 0);

  const originalFetch = globalThis.fetch;
  const githubRequests = [];
  globalThis.fetch = async (input, init = {}) => {
    githubCalls += 1;
    const url = new URL(typeof input === 'string' ? input : input.url);
    const headers = new Headers(init.headers);
    assert.equal(url.hostname, 'api.github.com');
    assert.equal(headers.get('User-Agent'), 'single-timeline-blog-publisher');
    assert.equal(headers.get('Authorization'), `Bearer ${env.GITHUB_TOKEN}`);
    githubRequests.push({ method: init.method || 'GET', path: url.pathname });

    const method = init.method || 'GET';
    const path = url.pathname;
    const key = `${method} ${path}`;
    let data;
    if (method === 'POST' && path.endsWith('/git/blobs')) {
      const blob = JSON.parse(init.body);
      assert.equal(blob.content, 'A test post');
      assert.equal(blob.encoding, 'utf-8');
      data = { sha: 'blob-sha' };
    } else if (method === 'GET' && path.endsWith('/git/ref/heads/main')) {
      data = { object: { sha: 'parent-sha' } };
    } else if (method === 'GET' && path.endsWith('/git/commits/parent-sha')) {
      data = { tree: { sha: 'base-tree-sha' } };
    } else if (method === 'POST' && path.endsWith('/git/trees')) {
      data = { sha: 'tree-sha' };
    } else if (method === 'POST' && path.endsWith('/git/commits')) {
      data = { sha: 'commit-sha' };
    } else if (method === 'PATCH' && path.endsWith('/git/refs/heads/main')) {
      assert.equal(JSON.parse(init.body).force, false);
      data = {};
    } else {
      throw new Error(`Unexpected GitHub request: ${key}`);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  try {
    const publish = await worker.fetch(makeRequest('/api/publish', {
      method: 'POST',
      cookie,
      body: { body: 'A test post', images: [] }
    }), env);
    assert.equal(publish.status, 200);
    const result = await publish.json();
    assert.equal(result.ok, true);
    assert.match(result.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    assert.equal(githubRequests.length, 6);
  } finally {
    globalThis.fetch = originalFetch;
  }

  const logout = await worker.fetch(makeRequest('/api/logout', { method: 'POST', cookie }), env);
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('Set-Cookie'), /Max-Age=0/);
});
