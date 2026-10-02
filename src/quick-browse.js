const navigation = document.querySelector('.quick-browse');

if (navigation && 'IntersectionObserver' in window) {
  let timelineIndex;
  let windowStart = -1;
  const originalLink = navigation.querySelector('.quick-browse__link')?.cloneNode(true);
  let links = new Map(
    [...navigation.querySelectorAll('a[href^="#"]')]
      .map((link) => [decodeURIComponent(link.hash.slice(1)), link])
  );
  const observed = new Map();
  const markerPosition = () => window.innerHeight * 0.28;
  let updateScheduled = false;

  function setActive(id) {
    for (const [targetId, link] of links) {
      if (targetId === id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

  function updateActive() {
    const candidates = [...observed.keys()]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const marker = markerPosition();
    candidates.sort((first, second) => {
      const a = first.getBoundingClientRect();
      const b = second.getBoundingClientRect();
      const aContainsMarker = a.top <= marker && a.bottom >= marker;
      const bContainsMarker = b.top <= marker && b.bottom >= marker;
      if (aContainsMarker !== bContainsMarker) return aContainsMarker ? -1 : 1;
      if (aContainsMarker) return b.top - a.top;
      return Math.abs(a.top - marker) - Math.abs(b.top - marker);
    });

    const active = candidates[0]?.id || '';
    const order = timelineIndex?.entries.find((entry) => entry.id === active)?.order;
    if (Number.isInteger(order) && originalLink && !navigation.querySelector(':focus-visible')
      && !(matchMedia('(hover: hover)').matches && navigation.matches(':hover'))) {
      const count = matchMedia('(max-width: 900px)').matches ? 5 : 8;
      const start = Math.min(Math.max(0, order - Math.floor(count / 2)), Math.max(0, timelineIndex.entries.length - count));
      if (windowStart !== start || links.size !== Math.min(count, timelineIndex.entries.length)) {
        windowStart = start;
        const list = navigation.querySelector('ol');
        list.replaceChildren(); links = new Map();
        for (const item of timelineIndex.entries.slice(start, start + count)) {
          const link = originalLink.cloneNode(true);
          link.href = `#${item.id}`;
          link.setAttribute('aria-label', `${item.date} · ${item.time} UTC: ${item.preview}`);
          link.removeAttribute('aria-current');
          link.querySelector('.quick-browse__mobile-label').textContent = item.time;
          link.querySelector('.quick-browse__meta').textContent = `${item.date} · ${item.time} UTC`;
          link.querySelector('.quick-browse__excerpt').textContent = item.preview;
          const li = document.createElement('li'); li.className = 'quick-browse__item'; li.append(link); list.append(li);
          links.set(item.id, link);
        }
      }
    }
    setActive(active);
  }

  function scheduleActiveUpdate() {
    if (updateScheduled) return;
    updateScheduled = true;
    requestAnimationFrame(() => {
      updateScheduled = false;
      updateActive();
    });
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) observed.set(entry.target.id, entry);
      else observed.delete(entry.target.id);
    }
    scheduleActiveUpdate();
  }, { rootMargin: '0px', threshold: 0 });

  function observeEntries() {
    observer.disconnect(); observed.clear();
    for (const entry of document.querySelectorAll('.entry[id]')) observer.observe(entry);
    scheduleActiveUpdate();
  }
  document.addEventListener('timeline:changed', (event) => { timelineIndex = event.detail.index; observeEntries(); });
  navigation.addEventListener('mouseleave', scheduleActiveUpdate);
  navigation.addEventListener('focusout', scheduleActiveUpdate);
  observeEntries();
  window.addEventListener('scroll', scheduleActiveUpdate, { passive: true });
  window.addEventListener('resize', scheduleActiveUpdate, { passive: true });
  scheduleActiveUpdate();
}
