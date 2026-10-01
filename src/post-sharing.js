const status = document.querySelector('[data-share-status]');
const shareButtons = [...document.querySelectorAll('[data-share-url]')];
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
  const delta = longEntry ? rect.top - targetTop : rect.top + rect.height / 2 - targetTop;
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

for (const button of shareButtons) {
  button.hidden = false;
  button.addEventListener('click', () => shareEntry(button));
}

document.addEventListener('click', (event) => {
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

  const target = entryFromAnchor(anchor);
  if (!target) return;

  event.preventDefault();
  const hash = `#${encodeURIComponent(target.id)}`;
  if (window.location.hash !== hash) window.history.pushState(null, '', hash);
  alignEntry(target, reduceMotion.matches ? 'instant' : 'smooth');
});

function entryFromAnchor(anchor) {
  let target;
  try {
    target = document.getElementById(decodeURIComponent(new URL(anchor.href).hash.slice(1)));
  } catch {
    return null;
  }
  return target?.matches('.entry') ? target : null;
}

const initialEntry = entryFromHash()
  || document.getElementById(document.body.dataset.initialEntry || '');

if (initialEntry) {
  let userInteracted = false;
  let adjustmentTimer;
  let correctionFrame;
  let previousScrollY = window.scrollY;
  const stopAdjustment = () => {
    if (userInteracted) return;
    userInteracted = true;
    window.clearTimeout(adjustmentTimer);
    if (correctionFrame) window.cancelAnimationFrame(correctionFrame);
    observer?.disconnect();
    window.removeEventListener('resize', correctAfterLayout);
    window.visualViewport?.removeEventListener('resize', correctAfterLayout);
  };
  const correctAfterLayout = () => {
    if (userInteracted || performance.now() >= stopAt || correctionFrame) return;
    correctionFrame = window.requestAnimationFrame(() => {
      correctionFrame = 0;
      const scrollDelta = Math.abs(window.scrollY - previousScrollY);
      previousScrollY = window.scrollY;
      if (scrollDelta <= 16) alignEntry(initialEntry);
    });
  };
  const stopAt = performance.now() + 2000;
  const observer = 'ResizeObserver' in window
    ? new ResizeObserver(correctAfterLayout)
    : null;

  observer?.observe(document.querySelector('.timeline') || document.body);
  window.visualViewport?.addEventListener('resize', correctAfterLayout, { passive: true });
  window.addEventListener('resize', correctAfterLayout, { passive: true });
  window.addEventListener('wheel', stopAdjustment, { passive: true, once: true });
  window.addEventListener('touchstart', stopAdjustment, { passive: true, once: true });
  window.addEventListener('pointerdown', stopAdjustment, { passive: true, once: true });
  window.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) {
      stopAdjustment();
    }
  });
  adjustmentTimer = window.setTimeout(stopAdjustment, 2000);

  window.requestAnimationFrame(() => {
    alignEntry(initialEntry);
    previousScrollY = window.scrollY;
  });
  document.fonts?.ready.then(correctAfterLayout);
}
