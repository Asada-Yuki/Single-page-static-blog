import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index.js';

const origin = 'https://blog.example';
const loginLimitKeys = [];
const env = {
  AUTHOR_KEY: 'a'.repeat(64),
  AUTHOR_LOGIN_LIMITER: {
    async limit({ key }) {
      loginLimitKeys.push(key);
      return { success: true };
    }
  },
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

test('login is rate limited and fails closed when the binding is missing', async () => {
  const blocked = await worker.fetch(makeRequest('/api/login', {
    method: 'POST',
    body: { authorKey: env.AUTHOR_KEY }
  }), {
    ...env,
    AUTHOR_LOGIN_LIMITER: { async limit({ key }) { loginLimitKeys.push(key); return { success: false }; } }
  });
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get('Retry-After'), '60');
  assert.match((await blocked.json()).error, /wait a minute/i);
  assert.equal(loginLimitKeys.at(-1), 'author-login:unknown');

  const unconfigured = await worker.fetch(makeRequest('/api/login', {
    method: 'POST',
    body: { authorKey: env.AUTHOR_KEY }
  }), { ...env, AUTHOR_LOGIN_LIMITER: undefined });
  assert.equal(unconfigured.status, 503);
});

test('writer headers, origin checks, session cookie, and GitHub publishing', async () => {
  const writerPage = await worker.fetch(makeRequest('/write'), env);
  assert.equal(writerPage.status, 200);
  assert.equal(writerPage.headers.get('Content-Type'), 'text/html; charset=utf-8');
  assert.match(writerPage.headers.get('Content-Security-Policy'), /default-src 'self'/);
  assert.equal(writerPage.headers.get('X-Robots-Tag'), 'noindex, nofollow, noarchive');
  assert.equal(writerPage.headers.get('Permissions-Policy'), 'camera=(), microphone=(), geolocation=()');
  assert.equal(writerPage.headers.get('Cache-Control'), 'no-store');
  assert.match(await writerPage.text(), /clear-draft-button/);

  const writerScript = await worker.fetch(makeRequest('/write.js'), env);
  assert.equal(writerScript.status, 200);
  assert.equal(writerScript.headers.get('Content-Type'), 'text/javascript; charset=utf-8');
  assert.match(await writerScript.text(), /Pages will rebuild automatically/);

  const writerStyles = await worker.fetch(makeRequest('/write.css'), env);
  assert.equal(writerStyles.status, 200);
  assert.equal(writerStyles.headers.get('Content-Type'), 'text/css; charset=utf-8');
  assert.match(await writerStyles.text(), /clear-draft-button/);

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

  const attemptResponse = await worker.fetch(makeRequest('/api/attempt', { method: 'POST', cookie }), env);
  assert.equal(attemptResponse.status, 200);
  const attempt = await attemptResponse.json();
  assert.match(attempt.id, /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i);
  assert.match(attempt.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

  const foreignOriginAttempt = await worker.fetch(makeRequest('/api/attempt', {
    method: 'POST',
    requestOrigin: 'https://attacker.example',
    cookie
  }), env);
  assert.equal(foreignOriginAttempt.status, 403);

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

  const invalidTimestampPublish = await worker.fetch(makeRequest('/api/publish', {
    method: 'POST',
    cookie,
    body: {
      body: 'invalid timestamp',
      images: [],
      attemptId: attempt.id,
      timestamp: '2026-02-31T12:00:00.000Z'
    }
  }), env);
  assert.equal(invalidTimestampPublish.status, 400);
  assert.equal(githubCalls, 0);

  const imageId = '11111111-1111-4111-8111-111111111111';
  const webpData = Buffer.from('RIFFxxxxWEBP').toString('base64');
  const invalidAltPublish = await worker.fetch(makeRequest('/api/publish', {
    method: 'POST',
    cookie,
    body: {
      body: `A test post\n\n[[image:${imageId}]]`,
      images: [{ id: imageId, data: webpData, alt: 'a'.repeat(251) }],
      attemptId: attempt.id,
      timestamp: attempt.timestamp
    }
  }), env);
  assert.equal(invalidAltPublish.status, 400);
  assert.equal(githubCalls, 0);

  const originalFetch = globalThis.fetch;
  const githubRequests = [];
  const postPaths = [];
  const submittedBlobs = [];
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
      submittedBlobs.push(blob);
      data = { sha: 'blob-sha' };
    } else if (method === 'GET' && path.endsWith('/git/ref/heads/main')) {
      data = { object: { sha: 'parent-sha' } };
    } else if (method === 'GET' && path.endsWith('/git/commits/parent-sha')) {
      data = { tree: { sha: 'base-tree-sha' } };
    } else if (method === 'POST' && path.endsWith('/git/trees')) {
      const tree = JSON.parse(init.body);
      postPaths.push(tree.tree.find((entry) => entry.path.endsWith('.md')).path);
      data = { sha: 'tree-sha' };
    } else if (method === 'POST' && path.endsWith('/git/commits')) {
      data = { sha: 'a'.repeat(40) };
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
      body: {
        body: `A test post\n\n[[image:${imageId}]]`,
        images: [{ id: imageId, data: webpData, alt: 'Yuki portrait' }],
        attemptId: attempt.id,
        timestamp: attempt.timestamp
      }
    }), env);
    assert.equal(publish.status, 200);
    const result = await publish.json();
    assert.equal(result.ok, true);
    assert.equal(result.timestamp, attempt.timestamp);
    assert.equal(result.commit, 'a'.repeat(40));
    assert.equal(githubRequests.length, 7);
    assert.equal(submittedBlobs[0].encoding, 'base64');
    assert.match(submittedBlobs[1].content, /!\[Yuki portrait\]\(\/images\/\d{4}\/\d{2}\/.+\.webp\)/);
    assert.equal(submittedBlobs[1].encoding, 'utf-8');

    const retriedPublish = await worker.fetch(makeRequest('/api/publish', {
      method: 'POST',
      cookie,
      body: {
        body: `A test post\n\n[[image:${imageId}]]`,
        images: [{ id: imageId, data: webpData, alt: 'Yuki portrait' }],
        attemptId: attempt.id,
        timestamp: attempt.timestamp
      }
    }), env);
    assert.equal(retriedPublish.status, 200);
    assert.equal(postPaths.length, 2);
    assert.equal(postPaths[0], postPaths[1]);
    assert.equal((await retriedPublish.json()).commit, 'a'.repeat(40));
  } finally {
    globalThis.fetch = originalFetch;
  }

  const logout = await worker.fetch(makeRequest('/api/logout', { method: 'POST', cookie }), env);
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('Set-Cookie'), /Max-Age=0/);
});
