import { cp, mkdir, mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
export const repo = new URL('../', import.meta.url).pathname;
export const run = promisify(execFile);
export async function fixtureSite(posts = 1) {
  const root = await mkdtemp(join(tmpdir(), 'yuki-regression-'));
  await Promise.all(['src', 'public'].map((name) => cp(join(repo, name), join(root, name), { recursive: true })));
  await cp(join(repo, 'site.json'), join(root, 'site.json'));
  await mkdir(join(root, 'content/2026/10'), { recursive: true });
  await mkdir(join(root, 'public/images/2026/10'), { recursive: true });
  await cp(join(repo, 'test/fixtures/pixel.webp'), join(root, 'public/images/2026/10/pixel.webp'));
  const keys = [];
  for (let n = 0; n < posts; n++) {
    const stamp = new Date(Date.UTC(2026, 9, 1, 0, n)).toISOString().replaceAll(':', '-');
    const key = `${stamp}-${n.toString(16).padStart(32, '0')}`;
    keys.unshift(key);
    await writeFile(join(root, `content/2026/10/${key}.md`), `Fixture ${n}\nLine A\nLine B\n\nhttps://example.com/\n\n![pixel](/images/2026/10/pixel.webp)\n`);
  }
  return { root, keys };
}
export function build(root) { return run(process.execPath, [join(repo, 'build.mjs')], { env: { ...process.env, YUKI_BUILD_ROOT: root } }); }
export function read(root, path) { return readFile(join(root, 'dist', path), 'utf8'); }
