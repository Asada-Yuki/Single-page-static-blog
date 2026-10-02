import { test, expect } from '@playwright/test';
import { sha256, snapshotText } from '../../shared/publish-protocol.js';
const pixel=new URL('../fixtures/pixel.webp',import.meta.url).pathname;
async function index(page) {return (await page.request.get('/test-index')).json();}
async function settled(page) {await expect(page.locator('.timeline[aria-busy="true"]')).toHaveCount(0);}
async function centered(locator) {await expect.poll(async()=>locator.evaluate(el=>Math.abs(el.getBoundingClientRect().top+Math.min(el.getBoundingClientRect().height,innerHeight)*.5-innerHeight*.5))).toBeLessThan(8);}
async function mockWriter(context, publish) {
 await context.route('**/api/session',r=>r.fulfill({json:{authenticated:true}}));
 await context.route('**/api/attempt',async r=>{const {snapshotHash}=r.request().postDataJSON(); await r.fulfill({json:{id:crypto.randomUUID(),timestamp:new Date().toISOString(),snapshotHash,signature:'a'.repeat(43)}});});
 await context.route('**/api/publish',publish);
}
function receipt(p) {const key=p.timestamp.replaceAll(':','-')+'-'+p.attemptId.replaceAll('-','');return {ok:true,...p,commit:'1'.repeat(40),bodyHash:'2'.repeat(64),key,permalink:`/p/${key}/`};}

test('shared target centers; both scrolling directions load chronological entries; sidebar changes',async({page})=>{
 const data=await index(page),target=data.entries[20];
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(target.url);await centered(page.locator('#'+target.id));
 await expect(page.locator('.entry')).toHaveCount(9);
 for(let n=0;n<3 && await page.locator('.timeline-edge').first().isVisible();n++){await page.locator('.timeline-edge').first().scrollIntoViewIfNeeded(); await expect.poll(()=>page.locator('.entry').count()).toBeGreaterThan(9); await page.waitForTimeout(200);await settled(page);}
 await expect.poll(()=>page.locator('.entry').count()).toBeGreaterThan(9);
 await page.locator('.timeline-edge').last().scrollIntoViewIfNeeded(); await expect.poll(()=>page.locator('.entry').count()).toBeGreaterThan(29);
 const orders=await page.locator('.entry').evaluateAll((els, entries)=>els.map(el=>entries.find(e=>e.id===el.id).order),data.entries);
 expect(orders).toEqual([...orders].sort((a,b)=>a-b));expect(new Set(orders).size).toBe(orders.length);
 const days=await page.locator('.day').evaluateAll(els=>els.map(e=>e.dataset.date));expect(new Set(days).size).toBe(days.length);
 expect(errors).toEqual([]);
});
test('fragment navigation and browser back restore the actual reading position',async({page})=>{
 const data=await index(page);await page.goto(data.entries[20].url); await centered(page.locator('#'+data.entries[20].id));
 const link=page.locator(`.quick-browse a[href="#${data.entries[22].id}"]`);await link.click();await centered(page.locator('#'+data.entries[22].id));
 await page.goBack();await centered(page.locator('#'+data.entries[20].id));
 await page.evaluate(id=>{location.hash=id;},data.entries[46].id);await centered(page.locator('#'+data.entries[46].id));
});
test('linked image has no nested button; keyboard, gallery and outside click close',async({page})=>{
 const data=await index(page);await page.goto(data.entries[20].url);
 const image=page.locator('#'+data.entries[20].id+' .entry-content img').first();await image.click();
 await expect(page.locator('.image-viewer')).toBeVisible();await expect(page.locator('.image-viewer__count')).toContainText('1 / 2');
 await expect(page.locator('.entry-content a button')).toHaveCount(0);
 await page.locator('.image-viewer__next').click();await expect(page.locator('.image-viewer__count')).toContainText('2 / 2');
 await page.keyboard.press('Escape');await expect(page.locator('.image-viewer')).not.toBeVisible();
 await page.goto(data.entries[0].url);await page.locator('.entry-content img').first().click();
 await expect(page.locator('.image-viewer')).toHaveAttribute('data-single','true');
 await expect(page.locator('.image-viewer__previous')).not.toBeVisible();
 await page.locator('.image-viewer__stage').click({position:{x:2,y:2}});await expect(page.locator('.image-viewer')).not.toBeVisible();
});
test('mobile layout, single photo uses viewport width, theme persists',async({page})=>{
 await page.setViewportSize({width:390,height:844});const data=await index(page);await page.goto(data.entries[0].url);
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('.entry-content img').first().click();
 expect(await page.locator('.image-viewer__stage').evaluate(el=>el.clientWidth)).toBeGreaterThan(330);
 await page.keyboard.press('Escape');
 const theme=page.locator('[data-theme-toggle]');await theme.click();const selected=await page.locator('html').getAttribute('data-theme');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme',selected);
});
test('no JavaScript keeps the shared post and adjacent links readable',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto('http://127.0.0.1:4177/');
 const link=await page.locator('.entry-permalink').first().getAttribute('href');await page.goto('http://127.0.0.1:4177'+link);
 await expect(page.locator('.entry')).toHaveCount(1);await expect(page.locator('.context-links a')).toHaveCount(1);await context.close();
});
test('HTTP 200 HTML and malformed JSON never clear a draft; changed text gets a new attempt',async({page,context})=>{
 const payloads=[];let n=0;await mockWriter(context,async r=>{payloads.push(r.request().postDataJSON());n++;await r.fulfill(n===1?{status:200,contentType:'text/html',body:'<!doctype html>Success'}:{json:{ok:true}});});
 await page.goto('/write');await expect(page.locator('#post-body')).toBeEditable();await page.locator('#post-body').fill('Draft A');await page.locator('#publish-button').click();
 await expect(page.locator('#publish-status')).toContainText('unexpected response');await expect(page.locator('#post-body')).toHaveValue('Draft A');
 await page.locator('#publish-button').click();await expect(page.locator('#publish-status')).toContainText('not confirmed');expect(payloads[0].attemptId).toBe(payloads[1].attemptId);
 await page.locator('#post-body').fill('Draft B');await page.locator('#publish-button').click();await expect(page.locator('#publish-status')).toContainText('not confirmed');expect(payloads[2].attemptId).not.toBe(payloads[0].attemptId);
 expect(payloads[2].snapshotHash).toBe(await sha256(snapshotText('Draft B',[])));
});
test('photos survive reload, duplicate tabs use separate drafts, valid receipt preserves recovery',async({page,context})=>{
 await mockWriter(context,async r=>r.fulfill({json:receipt(r.request().postDataJSON())}));
 await page.goto('/write');await expect(page.locator('#post-body')).toBeEditable();await page.locator('#post-body').fill('Photo draft');await page.locator('#image-input').setInputFiles(pixel);await expect(page.locator('#attachments img')).toHaveCount(1);
 await page.waitForTimeout(400);await page.reload();await expect(page.locator('#attachments img')).toHaveCount(1);await expect(page.locator('#post-body')).toHaveValue(/Photo draft/);
 const id=await page.evaluate(()=>sessionStorage.getItem('yuki-draft-id-v2'));
 const tab=await context.newPage();await tab.addInitScript(id=>sessionStorage.setItem('yuki-draft-id-v2',id),id);await tab.goto('/write');await expect(tab.locator('#post-body')).toBeEditable();
 expect(await tab.evaluate(()=>sessionStorage.getItem('yuki-draft-id-v2'))).not.toBe(id);
 await tab.locator('#post-body').fill('Tab B');await tab.waitForTimeout(400);await expect(page.locator('#post-body')).toHaveValue(/Photo draft/);
 await page.locator('#publish-button').click();await expect(page.locator('#post-body')).toHaveValue('');await expect(page.locator('#recover-published-button')).toBeVisible();
 await page.locator('#recover-published-button').click();await expect(page.locator('#attachments img')).toHaveCount(1);await expect(page.locator('#post-body')).toHaveValue(/Photo draft/);
 await tab.close();
});
