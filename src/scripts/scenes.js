/* =========================================================================
   scenes.js — Visual-novel scene controller.
   Observes each .scene via IntersectionObserver and, when a scene becomes the
   "current page" (intersectionRatio ≥ 0.6), marks it active and triggers its
   page-specific behaviour:
     • Page 2 (scene-intro)    — types the merged self-intro + name story.
     • Page 3 (scene-interests)— fills the gel interest bars.
     • Page 4 (scene-end)      — dissolve-reveals the ending text (via CSS).
   Each scene plays only once (tracked via data-played) so re-entering a page
   does not retype or refill. The first scene (title) is marked active on load.
   prefers-reduced-motion: all text renders immediately and all bars fill.
   ========================================================================= */

import { typeDialog } from './typewriter.js';
import { fillBars } from './reveal.js';

/** A scene is considered the "current page" once this much of it is visible. */
const SCENE_THRESHOLD = 0.6;

/** Small delay before typing starts, so the scene can settle first. */
const DIALOG_START_DELAY_MS = 280;

/**
 * Typed content keyed by scene id. Only scenes that carry a .type-text
 * container need an entry here; scenes without an entry are skipped.
 * Page 2 merges the former self-intro and name-story pages into one sequence
 * of seven paragraphs, in the order specified by the brief.
 * @type {Record<string, string[]>}
 */
const DIALOG_CONTENT = {
  'scene-intro': [
    `Hello everyone, my name is Asada-Yuki.`,
    // <br> after "is:" fixes the line break point so the long second line
    // doesn't reflow (bounce) as characters are typed.
    `The origin of my name is:<br>Favorite anime character Asada Shino <span class="cn">⌈朝田诗乃⌋</span>`,
    `and Favorite Japanese singer Yui.`,
    // <br> after "勇气⌋" splits the four name groups across two lines so the
    // wrap point is fixed instead of shifting while typing.
    `As well as Yuki <span class="cn">⌈雪⌋</span> Yuuki <span class="cn">⌈勇气⌋</span><br><span class="cn">⌈希望⌋</span> <span class="cn">⌈祈祷⌋</span>.`,
    // <br> after "characters:" prevents reflow on narrower viewports where this
    // medium-length line would otherwise wrap at a shifting word boundary.
    `In Chinese characters:<br><span class="cn">⌈朝田由纪⌋</span> or <span class="cn">⌈朝田雪⌋</span>.`,
    // <br> after "slime," fixes the break point for this two-clause sentence.
    `Currently, I am a slime,<br>cold and soft, sleeping peacefully.`,
    `I hope to receive "love". Nice to meet you all~`,
  ],
};

/**
 * Extract the visible text from a paragraph that may contain trusted inline
 * HTML (e.g. <span class="cn">…</span>). Used to build a clean accessible name
 * free of markup, so screen readers don't announce the raw tags.
 * @param {string} html
 * @returns {string}
 */
function plainText(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  return tpl.content.textContent || '';
}

/**
 * Activate a scene: mark it played, type its text (if any), fill its bars
 * (if any). Runs at most once per scene.
 * @param {HTMLElement} scene
 */
function activateScene(scene) {
  if (!scene || scene.dataset.played === 'true') return;
  scene.dataset.played = 'true';

  const typeText = scene.querySelector('.type-text');
  const paragraphs = DIALOG_CONTENT[scene.id];

  if (typeText && paragraphs) {
    // Provide the full text as the accessible name; typed chars are aria-hidden.
    typeText.setAttribute('aria-label', paragraphs.map(plainText).join(' '));
    window.setTimeout(() => {
      typeDialog(typeText, paragraphs);
    }, DIALOG_START_DELAY_MS);
  }

  if (scene.querySelector('[data-bars]')) {
    fillBars(scene);
  }
}

/**
 * Highlight the page-dot whose data-page matches the given scene's index.
 * Removes .is-active from every dot first, then adds it to the matching one.
 * Safe to call before dots exist (no-op).
 * @param {number} sceneIndex - 0-based index of the now-active scene.
 * @returns {void}
 */
function setActiveDot(sceneIndex) {
  const dots = document.querySelectorAll('.page-dot');
  dots.forEach((dot) => {
    if (Number(dot.getAttribute('data-page')) === sceneIndex) {
      dot.classList.add('is-active');
    } else {
      dot.classList.remove('is-active');
    }
  });
}

/**
 * Initialise the scene controller. Call once on DOM ready.
 * @returns {void}
 */
export function initScenes() {
  const scenes = Array.from(document.querySelectorAll('.scene'));
  if (scenes.length === 0) return;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // Reduced motion: activate every scene immediately — text renders as full
  // paragraphs, bars fill, ending text is revealed. No observers needed.
  if (prefersReducedMotion) {
    scenes.forEach((scene, idx) => {
      scene.classList.add('scene-active');
      scene.dataset.played = 'true';

      const typeText = scene.querySelector('.type-text');
      const paragraphs = DIALOG_CONTENT[scene.id];
      if (typeText && paragraphs) {
        typeText.setAttribute('aria-label', paragraphs.map(plainText).join(' '));
        // Paragraphs now carry trusted inline HTML (e.g. <span class="cn">…</span>
        // no-break word groups), so render them directly without escaping.
        typeText.innerHTML = paragraphs
          .map((p) => `<p class="dialog-line" aria-hidden="true">${p}</p>`)
          .join('');
      }

      if (scene.querySelector('[data-bars]')) {
        fillBars(scene);
      }

      // Highlight the first dot under reduced-motion too (Page 1 in view).
      if (idx === 0) setActiveDot(idx);
    });
    return;
  }

  // The first scene (title) is in view on load — mark it active right away.
  if (scenes[0]) {
    scenes[0].classList.add('scene-active');
    scenes[0].dataset.played = 'true';
    setActiveDot(0);
  }

  // Graceful fallback when IntersectionObserver is unavailable.
  if (!('IntersectionObserver' in window)) {
    scenes.forEach((scene, idx) => {
      scene.classList.add('scene-active');
      activateScene(scene);
      setActiveDot(idx);
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio >= SCENE_THRESHOLD) {
          const scene = entry.target;
          scene.classList.add('scene-active');
          activateScene(scene);
          // Update the right-side page indicator to match this scene.
          const idx = scenes.indexOf(scene);
          if (idx !== -1) setActiveDot(idx);
        }
      });
    },
    {
      // Multiple thresholds so the ≥ 0.6 crossing is reliably reported.
      threshold: [0, 0.25, 0.6, 0.9],
    }
  );

  scenes.forEach((scene) => observer.observe(scene));
}
