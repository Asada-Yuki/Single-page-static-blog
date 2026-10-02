import { ensureEntry, timelineReady } from './timeline.js';

const status = document.querySelector('[data-share-status]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let statusTimer;

function announce(message) {
  if (!status) return;
  window.clearTimeout(statusTimer);
  status.textContent = message;
  status.hidden = false;
  statusTimer = window.setTimeout(() => {
    status.hidden = true;
    status.textContent = '';
  }, 2200);
}

function revealManualCopy(button, message = '请手动复制这条链接。') {
  const entry = button.closest('.entry');
  const fallback = entry?.querySelector('[data-share-fallback]');
  const input = fallback?.querySelector('input');
  if (!fallback || !input) {
    announce(message);
    return;
  }

  for (const other of document.querySelectorAll('[data-share-fallback]:not([hidden])')) {
    other.hidden = true;
  }
  input.value = button.dataset.shareUrl || '';
  fallback.hidden = false;
  announce(message);
  input.focus();
  input.select();
}

async function copyUrl(button) {
  const url = button.dataset.shareUrl || '';
  if (!url) return false;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      announce('链接已复制');
      return true;
    } catch {
      // Clipboard permission can be unavailable even on a secure origin.
    }
  }

  revealManualCopy(button);
  return false;
}

async function shareEntry(button) {
  const url = button.dataset.shareUrl || '';
  if (!url) return;

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: button.dataset.shareTitle || document.title,
        url
      });
      announce('分享已完成');
      return;
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
  }

  await copyUrl(button);
}

function viewportBounds() {
  const viewport = window.visualViewport;
  const top = viewport?.offsetTop ?? 0;
  const height = viewport?.height ?? document.documentElement.clientHeight;
  let bottom = top + height;
  const dock = document.querySelector('.quick-browse');

  if (dock) {
    const rect = dock.getBoundingClientRect();
    const shell = document.querySelector('.timeline-shell')?.getBoundingClientRect();
    const overlapsTimeline = !shell || (rect.left < shell.right && rect.right > shell.left);
    if (overlapsTimeline && rect.top < bottom && rect.bottom > top) {
      bottom = Math.max(top, rect.top - 12);
    }
  }

  return { top, bottom, height: Math.max(1, bottom - top) };
}

function alignEntry(entry, behavior = 'instant') {
  if (!entry?.isConnected) return;
  const rect = entry.getBoundingClientRect();
  const viewport = viewportBounds();
  const longEntry = rect.height > viewport.height * 0.7;
  const targetTop = longEntry
    ? viewport.top + viewport.height * 0.16
    : viewport.top + (viewport.height - rect.height) / 2;
  const delta = rect.top - targetTop;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const nextScroll = Math.min(maxScroll, Math.max(0, window.scrollY + delta));
  window.scrollTo({ top: nextScroll, behavior });
}

function entryFromHash() {
  if (!window.location.hash || window.location.hash === '#') return null;
  let id;
  try {
    id = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return null;
  }
  const target = document.getElementById(id);
  return target?.matches('.entry') ? target : null;
}

function revealShareButtons() {
  for (const button of document.querySelectorAll('[data-share-url]')) button.hidden = false;
}
revealShareButtons();
document.addEventListener('timeline:changed', revealShareButtons);

document.addEventListener('click', async (event) => {
  const shareButton = event.target.closest('[data-share-url]');
  if (shareButton) { await shareEntry(shareButton); return; }
  const closeButton = event.target.closest('[data-share-close]');
  if (closeButton) {
    const fallback = closeButton.closest('[data-share-fallback]');
    const shareButton = closeButton.closest('.entry')?.querySelector('[data-share-url]');
    if (fallback) fallback.hidden = true;
    shareButton?.focus();
    return;
  }

  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor || event.defaultPrevented || event.button !== 0
    || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  let id;
  try { id = decodeURIComponent(new URL(anchor.href).hash.slice(1)); } catch { return; }
  if (!id.startsWith('entry-')) return;
  event.preventDefault();
  saveHistory();
  const target = await ensureEntry(id);
  if (!target) return;
  const hash = `#${encodeURIComponent(target.id)}`;
  if (window.location.hash !== hash) window.history.pushState({ yukiEntry: target.id }, '', hash);
  centerTimeline();
  alignEntry(target, reduceMotion.matches ? 'instant' : 'smooth');
  setTimeout(saveHistory, 500);
});

function centerTimeline() {
  const timeline = document.querySelector('.timeline');
  if (timeline) timeline.dataset.centered = 'true';
}

let historyTimer;
function saveHistory() {
  if (restoring) return;
  const entries = [...document.querySelectorAll('.entry')];
  const anchor = entries.find((entry) => entry.getBoundingClientRect().bottom > 0) || entries[0];
  history.replaceState({ ...history.state, yukiScroll: window.scrollY,
    yukiAnchor: anchor?.id, yukiOffset: anchor?.getBoundingClientRect().top }, '');
}

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.addEventListener('scroll', () => {
  clearTimeout(historyTimer); historyTimer = setTimeout(saveHistory, 200);
}, { passive: true });
let restoring = false;
let ignoreHash;
async function restoreHistory(state) {
  restoring = true;
  try {
    let hashId = '';
    try { hashId = decodeURIComponent(location.hash.slice(1)); } catch { /* Ignore malformed fragments. */ }
    const id = state?.yukiAnchor || hashId;
    const target = id ? await ensureEntry(id) : null;
    if (target && Number.isFinite(state?.yukiOffset)) {
      centerTimeline();
      await new Promise(requestAnimationFrame);
      window.scrollBy({ top: target.getBoundingClientRect().top - state.yukiOffset, behavior: 'instant' });
    } else if (target) { centerTimeline(); alignEntry(target); }
    else if (Number.isFinite(state?.yukiScroll)) window.scrollTo({ top: state.yukiScroll, behavior: 'instant' });
  } finally { restoring = false; saveHistory(); }
}
window.addEventListener('popstate', (event) => {
  ignoreHash = location.hash;
  clearTimeout(historyTimer);
  void restoreHistory(event.state);
});
window.addEventListener('hashchange', () => {
  if (ignoreHash === location.hash) { ignoreHash = undefined; return; }
  if (!restoring) void restoreHistory(null);
});
window.addEventListener('pagehide', saveHistory);
window.addEventListener('pageshow', (event) => { if (event.persisted) void restoreHistory(history.state); });

await timelineReady;
let initialId;
try { initialId = decodeURIComponent(location.hash.slice(1)); } catch { /* Invalid fragments are ignored. */ }
initialId ||= document.body.dataset.initialEntry;
const initialEntry = initialId ? await ensureEntry(initialId) : null;
if (initialEntry) {
  centerTimeline();
  let stopped = false;
  let frame;
  let observer;
  const stop = () => { stopped = true; observer?.disconnect(); };
  const correct = () => {
    if (stopped || frame) return;
    frame = requestAnimationFrame(() => { frame = null; if (!stopped) { alignEntry(initialEntry); saveHistory(); } });
  };
  for (const name of ['wheel', 'touchstart', 'pointerdown']) window.addEventListener(name, stop, { passive: true, once: true });
  window.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) stop();
  });
  observer = new ResizeObserver(correct);
  observer.observe(initialEntry);
  document.fonts?.ready.then(correct);
  correct();
  const images = [...initialEntry.querySelectorAll('img')];
  await Promise.all(images.map((image) => image.complete ? Promise.resolve() : new Promise((resolve) => {
    image.addEventListener('load', resolve, { once: true }); image.addEventListener('error', resolve, { once: true });
  })));
  correct();
  setTimeout(stop, 1200);
} else {
  if (Number.isFinite(history.state?.yukiScroll)) await restoreHistory(history.state);
  else saveHistory();
}
