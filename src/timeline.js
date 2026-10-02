const timeline = document.querySelector('.timeline');
let index;
let entriesByKey = new Map();
let generation = 0;
const chunks = new Map();
const loaded = new Set();
let busy = false;
let observer;
const topEdge = document.createElement('div');
const bottomEdge = document.createElement('div');
topEdge.className = bottomEdge.className = 'timeline-edge';
topEdge.setAttribute('aria-hidden', 'true');
bottomEdge.setAttribute('aria-hidden', 'true');
const status = document.createElement('p');
status.className = 'timeline-load-status';
status.setAttribute('role', 'status');
status.hidden = true;

async function getJson(path) {
  const response = await fetch(path, { signal: AbortSignal.timeout(12000) });
  if (!response.ok || !(response.headers.get('content-type') || '').includes('application/json')) throw new Error('Timeline unavailable.');
  return response.json();
}

function showError() {
  status.hidden = false;
  status.replaceChildren(document.createTextNode('相邻内容暂时没有加载。'));
  const retry = document.createElement('button');
  retry.type = 'button'; retry.textContent = '重试';
  retry.addEventListener('click', () => location.reload());
  status.append(retry);
}

function visibleAnchor() {
  return [...timeline.querySelectorAll('.entry')].find((entry) => entry.getBoundingClientRect().bottom > 0)
    || timeline.querySelector('.entry');
}

function insert(record) {
  if (loaded.has(record.key)) return;
  const entry = entriesByKey.get(record.key);
  if (!entry) throw new Error('Unknown timeline entry.');
  const template = document.createElement('template');
  template.innerHTML = record.html;
  const day = template.content.querySelector('.day');
  const article = day?.querySelector('.entry');
  if (!article || article.id !== entry.id || article.dataset.postKey !== entry.key) throw new Error('Invalid timeline entry.');
  const articles = [...timeline.querySelectorAll('.entry')];
  const nextArticle = articles.find((item) => {
    const order = entriesByKey.get(item.dataset.postKey)?.order;
    return order > entry.order;
  });
  const previousArticle = nextArticle ? articles[articles.indexOf(nextArticle) - 1] : articles.at(-1);
  const nextDay = nextArticle?.closest('.day');
  const previousDay = previousArticle?.closest('.day');
  if (nextDay?.dataset.date === day.dataset.date) nextDay.insertBefore(article, nextArticle);
  else if (previousDay?.dataset.date === day.dataset.date) previousDay.append(article);
  else timeline.insertBefore(day, nextDay || bottomEdge);
  loaded.add(record.key);
}

async function chunk(number) {
  if (!chunks.has(number)) chunks.set(number, getJson(index.chunks[number]).then((data) => {
    if (data.revision !== index.revision || !Array.isArray(data.entries)) throw new Error('Timeline version changed.');
    return data.entries;
  }).catch((error) => { chunks.delete(number); throw error; }));
  return chunks.get(number);
}

function loadedBounds() {
  const orders = index.entries.filter((entry) => loaded.has(entry.key)).map((entry) => entry.order);
  return { first: Math.min(...orders), last: Math.max(...orders) };
}

async function loadRange(first, last) {
  const currentGeneration = generation;
  const firstChunk = Math.floor(Math.max(0, first) / index.chunkSize);
  const lastChunk = Math.floor(Math.min(index.entries.length - 1, last) / index.chunkSize);
  const numbers = Array.from({ length: Math.max(0, lastChunk - firstChunk + 1) }, (_, n) => firstChunk + n);
  const records = (await Promise.all(numbers.map(chunk))).flat();
  if (currentGeneration !== generation) return;
  const anchor = visibleAnchor();
  const before = anchor?.getBoundingClientRect().top;
  records.sort((a, b) => entriesByKey.get(a.key)?.order - entriesByKey.get(b.key)?.order);
  for (const record of records) {
    const order = entriesByKey.get(record.key)?.order;
    if (order >= first && order <= last) insert(record);
  }
  if (anchor?.isConnected && before !== undefined) window.scrollBy({ top: anchor.getBoundingClientRect().top - before, behavior: 'instant' });
  const bounds = loadedBounds();
  topEdge.hidden = bounds.first <= 0;
  bottomEdge.hidden = bounds.last >= index.entries.length - 1;
  document.dispatchEvent(new CustomEvent('timeline:changed', { detail: { index } }));
}

async function extend(direction) {
  if (busy || !index) return;
  const bounds = loadedBounds();
  if (direction < 0 && bounds.first <= 0 || direction > 0 && bounds.last >= index.entries.length - 1) return;
  busy = true;
  timeline.setAttribute('aria-busy', 'true');
  try {
    await loadRange(direction < 0 ? Math.max(0, bounds.first - index.chunkSize) : bounds.last + 1,
      direction < 0 ? bounds.first - 1 : Math.min(index.entries.length - 1, bounds.last + index.chunkSize));
    status.hidden = true;
  } catch { showError(); }
  finally { busy = false; timeline.setAttribute('aria-busy', 'false'); }
}

function parseHash() {
  try { return decodeURIComponent(location.hash.slice(1)); } catch { return ''; }
}

export const timelineReady = (async () => {
  if (!timeline || !document.body.dataset.timelineIndex) return;
  for (const article of timeline.querySelectorAll('.entry')) loaded.add(article.dataset.postKey);
  timeline.prepend(topEdge); timeline.append(bottomEdge); timeline.after(status);
  try {
    index = await getJson(document.body.dataset.timelineIndex);
    if (!Array.isArray(index.entries) || !Array.isArray(index.chunks) || index.chunkSize !== 12
      || !/^[a-f0-9]{12}$/.test(index.revision) || index.entries.length > 10000) throw new Error('Invalid timeline index.');
    for (const path of index.chunks) if (!/^\/timeline\/chunk-\d+-[a-f0-9]{12}\.json$/.test(path)) throw new Error('Invalid timeline chunk.');
    entriesByKey = new Map(index.entries.map((entry, order) => {
      if (entry.order !== order || !/^entry-[A-Za-z0-9_-]+$/.test(entry.id) || typeof entry.key !== 'string') throw new Error('Invalid timeline entry.');
      return [entry.key, entry];
    }));
    if (!index.entries.length) { topEdge.hidden = bottomEdge.hidden = true; return index; }
    const targetId = parseHash() || document.body.dataset.initialEntry;
    const target = index.entries.find((entry) => entry.id === targetId);
    if (target && !loaded.has(target.key)) reset();
    if (target) await loadRange(Math.max(0, target.order - 4), Math.min(index.entries.length - 1, target.order + 4));
    else if (index.entries.length) await loadRange(0, Math.min(index.entries.length - 1, index.chunkSize - 1));
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) void extend(entry.target === topEdge ? -1 : 1);
    }, { rootMargin: '180px' });
    observer.observe(topEdge); observer.observe(bottomEdge);
    return index;
  } catch { showError(); return null; }
})();

function reset() {
  generation += 1;
  for (const day of timeline.querySelectorAll('.day')) day.remove();
  loaded.clear();
}

export async function ensureEntry(id) {
  await timelineReady;
  const existing = document.getElementById(id);
  if (existing?.matches('.entry')) return existing;
  const target = index?.entries.find((entry) => entry.id === id);
  if (!target) return null;
  busy = true;
  try {
    reset();
    await loadRange(Math.max(0, target.order - 4), Math.min(index.entries.length - 1, target.order + 4));
    return document.getElementById(id);
  } catch { showError(); return null; }
  finally { busy = false; }
}
