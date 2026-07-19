/* =========================================================================
   main.js — entry point.
   Imports styles, boots the hero typewriter and the visual-novel scene
   controller. The scene controller handles dialog typing, bar filling and
   dissolve-reveal triggering on page turn.
   ========================================================================= */

// Disable browser scroll restoration BEFORE any scene/snap initialisation so
// a page refresh always lands on Page 1 (title + avatar) instead of resuming
// the last scroll position (which could be Page 3/4). The <head> inline
// script sets history.scrollRestoration = 'manual' even earlier (during HTML
// parse); this scrollTo(0, 0) is the belt-and-suspenders guarantee.
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

import '../styles/main.css';
import { initTypewriter } from './typewriter.js';
import { initScenes } from './scenes.js';

/**
 * Boot the page once the DOM is ready.
 */
function init() {
  const typewriterEl = document.getElementById('typewriter');
  if (typewriterEl) {
    initTypewriter(typewriterEl);
  }

  initScenes();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
