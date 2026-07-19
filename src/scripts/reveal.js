/* =========================================================================
   reveal.js — Gel interest-bar fill (动效 4, page-turn triggered)
   Exposes fillBars(container): animates every [data-bar] inside `container`
   from 0% → its target width, staggered. The stagger + transition reuse the
   original dissolve-reveal bar logic, but triggering is now driven by the
   scene observer (scenes.js) rather than a standalone scroll observer, so
   bars fill on page turn instead of on arbitrary scroll.
   Respects prefers-reduced-motion: fills immediately, no stagger.
   ========================================================================= */

/**
 * Fill every [data-bar] inside `container` from 0% to its target width.
 * Bars fill one after another with a 120ms stagger via transition-delay, so
 * the cascade is driven by CSS (smooth, GPU-friendly) rather than N timers.
 * Safe to call once when a scene becomes active.
 * @param {HTMLElement} container - the scene (or dialog) holding the bars.
 * @returns {void}
 */
export function fillBars(container) {
  if (!container) return;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const bars = Array.from(container.querySelectorAll('[data-bar]'));

  bars.forEach((bar, idx) => {
    const target = (bar.getAttribute('data-bar') || '0') + '%';

    if (prefersReducedMotion) {
      // No motion: jump straight to the target width, no stagger.
      bar.style.transitionDelay = '0ms';
      bar.style.width = target;
      return;
    }

    // Reset to 0 so the transition replays each time the scene is entered
    // for the first time. (scenes.js guards against re-triggering, but the
    // reset keeps the behaviour robust if called again.)
    bar.style.transitionDelay = '0ms';
    bar.style.width = '0%';
    // Stagger the fill: bar i waits i * 120ms before its width transition
    // starts. The transition itself (--t-bar, 0.9s) is defined in CSS.
    bar.style.transitionDelay = `${idx * 120}ms`;
    // Force a reflow so the 0% width is committed before we set the target;
    // without this some browsers batch the two writes and skip the transition.
    void bar.offsetWidth;
    bar.style.width = target;
  });
}
