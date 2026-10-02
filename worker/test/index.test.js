import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import worker, { SessionStore } from '../src/index.js';
import { decode } from '../../shared/webp-node.mjs';
import { sha256, snapshotText, validPublishResult } from '../../shared/publish-protocol.js';
const origin = 'https://yuki.art';
const key = 'a'.repeat(64);
const pixel = (await readFile(new URL('../../test/fixtures/pixel.webp', import.meta.url))).toString('base64');
function makeEnv() {
  const map = new Map(); let alarm;
  const storage = { put: async (k,v) => map.set(k,v), get: async k => map.get(k), delete: async k => (Array.isArray(k) ? k : [k]).forEach(v => map.delete(v)), list: async () => new Map(map), getAlarm: async () => alarm, setAlarm: async v => { alarm = v; } };
  const ledger = new SessionStore({ storage }, { WEBP_DECODER: decode });
  return { AUTHOR_KEY: key, SESSIONS: { idFromName: n => n, get: () => ({ fetch: (url, opts) => ledger.fetch(new Request(url, opts)) }) }, AUTHOR_LOGIN_LIMITER: { limit: async () => ({success:true}) }, AUTHOR_PUBLISH_LIMITER: { limit: async () => ({success:true}) }, GITHUB_OWNER: 'test', GITHUB_REPO: 'test', GITHUB_BRANCH: 'main', GITHUB_TOKEN: 'test-only', ASSETS: {fetch: async () => new Response('not found',{status:404})} };
}
function req(path, body, cookie, options = {}) {
  return new Request(origin + path, { method: body === undefined ? 'GET' : 'POST', headers: { Origin: options.origin || origin, 'Content-Type': 'application/json', ...(cookie ? {Cookie:cookie} : {}) }, ...(body !== undefined ? {body:JSON.stringify(body)} : {}) });
}
async function signIn(env) { const response = await worker.fetch(req('/api/login', {authorKey:key}),env); assert.equal(response.status,200); return response.headers.get('set-cookie').split(';')[0]; }
async function payload(env,cookie,body='Test\nline',images=[]) {
  const snapshotHash = await sha256(snapshotText(body, images));
  const response = await worker.fetch(req('/api/attempt',{snapshotHash},cookie),env);
  assert.equal(response.status,200); const attempt = await response.json();
  return { body, images, snapshotHash, attemptId:attempt.id,timestamp:attempt.timestamp,signature:attempt.signature };
}
function gitMock({ loseResponse = false, conflict = false, malformed = false } = {}) {
  let head = '1'.repeat(40), commits = 0; const files = new Map(), trees = new Map(), parents = new Map(), blobs = new Map();
  const reply = (data,status=200) => new Response(JSON.stringify(data), {status,headers:{'Content-Type':'application/json'}});
  const sha = text => createHash('sha1').update(text).digest('hex');
  return { files, get commits() {return commits;}, fetch: async (url, options={}) => {
    const path = new URL(url).pathname.replace('/repos/test/test','');
    const data = options.body ? JSON.parse(options.body) : {};
    if (malformed) return reply({});
    if(path === '/git/blobs') { const bytes = Buffer.from(data.content,data.encoding === 'base64' ? 'base64' : 'utf8'); const id = sha(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`),bytes])); blobs.set(id,bytes); return reply({sha:id}); }
    if(path.startsWith('/contents/')) { const file = decodeURIComponent(path.slice(10)); return files.has(file) ? reply({sha:files.get(file)}) : reply({message:'Not Found'},404); }
    if(path === '/git/ref/heads/main') return reply({object:{sha:head}});
    if(path.startsWith('/git/commits/') && options.method === 'GET') return reply({tree:{sha:'2'.repeat(40)}});
    if(path === '/git/trees') {const id = sha(JSON.stringify(data)); trees.set(id,data.tree); return reply({sha:id});}
    if(path === '/git/commits') {const id = sha(JSON.stringify(data)); parents.set(id,data); return reply({sha:id});}
    if(path === '/git/refs/heads/main') {
      if(conflict) {conflict = false; head = '3'.repeat(40); return reply({message:'Conflict'},409);}
      assert.equal(data.force,false); assert.equal(parents.get(data.sha).parents[0],head);
      head=data.sha; commits++; for(const entry of trees.get(parents.get(head).tree)) files.set(entry.path,entry.sha);
      if(loseResponse) {loseResponse=false; throw new TypeError('connection lost after commit');}
      return reply({object:{sha:head}});
    }
    throw Error(`Unexpected Git call ${options.method} ${path}`);
  }};
}
async function withGit(mock, fn) {const original=globalThis.fetch; globalThis.fetch=mock.fetch; try {await fn();} finally {globalThis.fetch=original;} }

test('login schemas, origin, rate protection and revocable logout', async () => {
  const env=makeEnv();
  assert.equal((await worker.fetch(req('/api/login',null),env)).status,400);
  assert.equal((await worker.fetch(req('/api/login',{authorKey:key},undefined,{origin:'https://evil.example'}),env)).status,403);
  assert.equal((await worker.fetch(req('/api/login',{authorKey:key}),{...env,AUTHOR_LOGIN_LIMITER:null})).status,503);
  assert.equal((await worker.fetch(req('/api/login',{authorKey:key}),{...env,AUTHOR_LOGIN_LIMITER:{limit:async()=>({success:false})}})).status,429);
  const cookie=await signIn(env);
  assert.equal((await (await worker.fetch(req('/api/session',undefined,cookie),env)).json()).authenticated,true);
  assert.equal((await worker.fetch(req('/api/logout',{},cookie),env)).status,200);
  assert.equal((await (await worker.fetch(req('/api/session',undefined,cookie),env)).json()).authenticated,false);
  assert.equal((await (await worker.fetch(req('/api/session',undefined,cookie),{...env,AUTHOR_KEY:'b'.repeat(64)})).json()).authenticated,false);
});
test('publishing retry is idempotent after a lost response and branch conflicts', async () => {
  const env=makeEnv(),cookie=await signIn(env),p=await payload(env,cookie);
  const git=gitMock({loseResponse:true,conflict:true});
  await withGit(git,async()=>{
    assert.equal((await worker.fetch(req('/api/publish',p,cookie),env)).status,500);
    const response=await worker.fetch(req('/api/publish',p,cookie),env); assert.equal(response.status,200);
    const result=await response.json(); assert.equal(result.alreadyPublished,true); assert.equal(git.commits,1);
    assert.equal(validPublishResult(result,{id:p.attemptId,...p}),true);
    const changed=await worker.fetch(req('/api/publish',{...p,body:'changed'},cookie),env); assert.equal(changed.status,409); assert.equal(git.commits,1);
    const postPath=[...git.files.keys()].find(path=>path.startsWith('content/')); git.files.set(postPath,'f'.repeat(40));
    assert.equal((await worker.fetch(req('/api/publish',p,cookie),env)).status,409);
  });
});
test('genuine WebP accepted; fake payload, missing photos, controls and tampered attempts rejected', async () => {
  const env=makeEnv(),cookie=await signIn(env),id=crypto.randomUUID();
  const images=[{id,data:pixel,alt:'Pixel'}]; const p=await payload(env,cookie,`Photo\n[[image:${id}]]`,images);
  await withGit(gitMock(),async()=>{
    const response=await worker.fetch(req('/api/publish',p,cookie),env); assert.equal(response.status,200,await response.clone().text());
    assert.equal((await worker.fetch(req('/api/publish',{...p,images:[{...images[0],data:Buffer.from('RIFF\x04\0\0\0WEBP','binary').toString('base64')}]},cookie),env)).status,400);
    assert.equal((await worker.fetch(req('/api/publish',{...p,images:[]},cookie),env)).status,400);
    assert.equal((await worker.fetch(req('/api/publish',{...p,body:'\u000b'},cookie),env)).status,400);
    assert.equal((await worker.fetch(req('/api/publish',{...p,timestamp:'0001-01-01T00:00:00.000Z'},cookie),env)).status,400);
    assert.equal((await worker.fetch(req('/api/publish',{...p,signature:'x'.repeat(43)},cookie),env)).status,400);
  });
});
test('malformed Git responses fail without changing the branch', async () => {
  const env=makeEnv(),cookie=await signIn(env),p=await payload(env,cookie);
  const git=gitMock({malformed:true}); await withGit(git,async()=> {assert.equal((await worker.fetch(req('/api/publish',p,cookie),env)).status,502); assert.equal(git.commits,0);});
});
test('writer aliases, modules and canonical host', async () => {
  const env=makeEnv();
  for(const path of ['/write/','/write.html']) {const r=await worker.fetch(req(path),env); assert.equal(r.status,308);assert.equal(r.headers.get('location'),'/write');}
  for(const path of ['/write','/write.js','/writer-protocol.js','/write-drafts.js']) {const r=await worker.fetch(req(path),env); assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/no-transform/);assert.match(r.headers.get('x-robots-tag'),/noindex/);}
  const r=await worker.fetch(new Request('https://www.yuki.art/write'),env);assert.equal(r.status,308);assert.equal(r.headers.get('location'),'https://yuki.art/write');
});
