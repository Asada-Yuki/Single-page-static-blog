import { createServer } from 'node:http';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';
import { fixtureSite, build, repo } from '../fixture-site.mjs';
const {root,keys}=await fixtureSite(48);
await writeFile(join(root,`content/2026/10/${keys[20]}.md`),'Middle post\nLine A\nLine B\n\n[![linked pixel](/images/2026/10/pixel.webp)](https://example.com/)\n\n![second pixel](/images/2026/10/pixel.webp)');
await build(root);
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.xml':'application/xml'};
const writer={'/write':'worker/public/write.html','/write.html':'worker/public/write.html','/write.js':'worker/public/write.js','/write.css':'worker/public/write.css','/write-drafts.js':'worker/public/draft-storage.js','/writer-protocol.js':'shared/publish-protocol.js'};
const server=createServer(async(req,res)=>{
 try {
  let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/test-index') {const html=await readFile(join(root,'dist/index.html'),'utf8'); const indexPath=html.match(/data-timeline-index="([^"]+)"/)[1]; res.setHeader('Content-Type','application/json');res.end(await readFile(join(root,'dist',indexPath)));return;}
  if(path==='/write/') {res.writeHead(308,{Location:'/write'});res.end();return;}
  const relative=writer[path];
  const target=relative ? resolve(repo,relative) : resolve(root,'dist',`.${path}${path.endsWith('/')?'index.html':''}`);
  if(!target.startsWith(relative?repo:join(root,'dist'))) throw Error('Bad path');
  const bytes=await readFile(target);
  res.setHeader('Content-Type',mime[extname(target)]||'text/plain');res.setHeader('Cache-Control','no-store');res.end(bytes);
 }catch {res.writeHead(404,{'Content-Type':'text/html'});res.end('<!doctype html><title>Not Found</title>Not Found');}
});server.listen(4177,'127.0.0.1');
process.on('SIGTERM',()=>{server.close();void rm(root,{recursive:true,force:true});});
