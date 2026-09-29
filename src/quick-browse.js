const navigation = document.querySelector('.quick-browse');

if (navigation && 'IntersectionObserver' in window) {
  const links = new Map(
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

    setActive(candidates[0]?.id || '');
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

  for (const entry of document.querySelectorAll('.entry[id]')) observer.observe(entry);
  window.addEventListener('scroll', scheduleActiveUpdate, { passive: true });
  window.addEventListener('resize', scheduleActiveUpdate, { passive: true });
  scheduleActiveUpdate();
}
