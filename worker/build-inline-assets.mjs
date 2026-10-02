import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const assets = [
  { path: '/writer-protocol.js', file: '../shared/publish-protocol.js', contentType: 'text/javascript; charset=utf-8' },
  { path: '/write.html', file: 'public/write.html', contentType: 'text/html; charset=utf-8' },
  { path: '/write.css', file: 'public/write.css', contentType: 'text/css; charset=utf-8' },
  { path: '/write.js', file: 'public/write.js', contentType: 'text/javascript; charset=utf-8' },
  { path: '/write-drafts.js', file: 'public/draft-storage.js', contentType: 'text/javascript; charset=utf-8' }
];

const entries = Object.fromEntries(await Promise.all(assets.map(async (asset) => [
  asset.path,
  {
    contentType: asset.contentType,
    body: await readFile(join(root, asset.file), 'utf8')
  }
])));

const output = `// Generated from worker/public. Run npm run build:worker-assets after editing those files.\nexport default Object.freeze(${JSON.stringify(entries, null, 2)});\n`;
await writeFile(join(root, 'src/writer-assets.js'), output);
