/* =========================================================================
   typewriter.js — Typewriter + Afterglow (动效 3)
   Two entry points:
     1. initTypewriter(element) — hero looping typewriter. Cycles through three
        phrases; each character is wrapped in a <span> that fires a 0.6s淡蓝
        text-shadow decay (afterglow) exactly once on landing. Cursor is a soft
        glowing vertical line. Respects prefers-reduced-motion (static phrase).
     2. typeDialog(element, paragraphs) — visual-novel dialog typewriter. Types
        an array of paragraphs sequentially, char by char, each char carrying
        the 0.6s afterglow. Spaces are kept as live text nodes so paragraphs
        wrap naturally at word boundaries. Respects prefers-reduced-motion
        (renders all paragraphs immediately).
   ========================================================================= */

const PHRASES = ['I\'m Asada Yuki', 'Suraimu Slime', 'LOVE YOU FOREVER'];

const TYPE_SPEED = 85;        // ms per char (hero typing)
const ERASE_SPEED = 40;       // ms per char (hero erasing)
const HOLD_AFTER_TYPE = 1800; // ms to hold a finished phrase
const HOLD_AFTER_ERASE = 350; // ms pause before the next phrase

const DIALOG_TYPE_SPEED = 42;       // ms per char (fullscreen typing)
const DIALOG_PARAGRAPH_PAUSE = 380; // ms pause between paragraphs

/**
 * Initialise the hero looping typewriter on a given element.
 * @param {HTMLElement} element - the element to fill with typed characters.
 * @returns {Function} destroy() — clears timers and stops the loop.
 */
export function initTypewriter(element) {
  if (!element) return () => {};

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // Reduced motion: show the first phrase statically, no cursor animation.
  if (prefersReducedMotion) {
    element.textContent = PHRASES[0];
    return () => {};
  }

  // Build the live structure: [chars wrapper][cursor]
  const charsWrap = document.createElement('span');
  charsWrap.className = 'tw-chars';
  charsWrap.setAttribute('aria-hidden', 'true');

  const cursor = document.createElement('span');
  cursor.className = 'tw-cursor';
  cursor.setAttribute('aria-hidden', 'true');

  // Pre-fill charsWrap with the first phrase so the hero text is visible
  // immediately on boot. The h1 already shows "I'm Asada Yuki" from index.html;
  // we convert it into the typewriter's span structure in a single synchronous
  // DOM swap (no per-char delay) so there is no "empty h1" gap. The loop then
  // starts from the hold phase instead of re-typing the first phrase.
  const firstPhrase = PHRASES[0];
  for (const ch of firstPhrase) {
    const span = document.createElement('span');
    span.className = 'tw-char';
    // Use non-breaking space so whitespace is visible in nowrap context.
    span.textContent = ch === ' ' ? '\u00A0' : ch;
    charsWrap.appendChild(span);
  }

  element.textContent = '';
  element.appendChild(charsWrap);
  element.appendChild(cursor);

  let phraseIndex = 0;
  let timer = setTimeout(() => erasePhrase(), HOLD_AFTER_TYPE);

  /**
   * Type a phrase character by character, wrapping each in an afterglow span.
   * @param {string} phrase
   */
  function typePhrase(phrase) {
    let i = 0;
    charsWrap.textContent = '';

    function typeNext() {
      if (i < phrase.length) {
        const ch = phrase[i];
        const span = document.createElement('span');
        span.className = 'tw-char';
        // Use non-breaking space so whitespace is visible in nowrap context.
        span.textContent = ch === ' ' ? '\u00A0' : ch;
        charsWrap.appendChild(span);
        i += 1;
        timer = setTimeout(typeNext, TYPE_SPEED);
      } else {
        timer = setTimeout(() => erasePhrase(), HOLD_AFTER_TYPE);
      }
    }

    typeNext();
  }

  /**
   * Erase the current phrase character by character from the end.
   */
  function erasePhrase() {
    function eraseNext() {
      const last = charsWrap.lastChild;
      if (last) {
        charsWrap.removeChild(last);
        timer = setTimeout(eraseNext, ERASE_SPEED);
      } else {
        phraseIndex = (phraseIndex + 1) % PHRASES.length;
        timer = setTimeout(() => typePhrase(PHRASES[phraseIndex]), HOLD_AFTER_ERASE);
      }
    }

    eraseNext();
  }

  // Cleanup callback.
  return function destroy() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
}

/**
 * Type an array of paragraphs into a dialog text container, sequentially and
 * char by char. Each non-space character is wrapped in a .tw-dchar span that
 * fires the 0.6s afterglow; spaces are inserted as live text nodes so the
 * paragraph wraps at word boundaries. A short pause separates paragraphs.
 *
 * Implementation: "render-once + reveal". For each paragraph the full HTML
 * (including <span class="cn"> groups and <br> line breaks) is rendered via
 * innerHTML in one shot, so the DOM layout — and therefore every character's
 * position — is fixed from the very first frame. We then walk the rendered
 * text nodes with a TreeWalker, wrap each non-space character in a .tw-dchar
 * span (initial opacity:0), and reveal them one at a time by adding the
 * .shown class. Because the DOM never grows or shifts, the browser never
 * re-evaluates word wrapping mid-typing — so neighbouring text never jumps
 * left/right when a .cn group (e.g. ⌈朝田诗乃⌋) lands on a line boundary.
 *
 * Paragraphs may carry trusted inline HTML — most notably
 * <span class="cn">⌈朝田诗乃⌋</span> groups that must stay together (no mid-word
 * line break). The HTML is parsed by innerHTML in one shot, so .cn's
 * white-space: nowrap holds across the whole group from the start.
 *
 * The container's accessible name should be set by the caller (via aria-label)
 * so screen readers announce the full text; the typed spans are marked
 * aria-hidden to avoid character-by-character chatter.
 *
 * @param {HTMLElement} element  - the .type-text container.
 * @param {string[]} paragraphs  - paragraphs to type, in order (may contain
 *   trusted inline HTML).
 * @returns {Function} destroy() — clears timers and stops typing.
 */
export function typeDialog(element, paragraphs) {
  if (!element || !Array.isArray(paragraphs) || paragraphs.length === 0) {
    return () => {};
  }

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // Reduced motion: render all paragraphs immediately, no animation. Content
  // is trusted inline HTML, so insert it directly (keeps .cn groups intact).
  if (prefersReducedMotion) {
    element.innerHTML = paragraphs
      .map((p) => `<p class="dialog-line" aria-hidden="true">${p}</p>`)
      .join('');
    return () => {};
  }

  element.textContent = '';

  let timer = null;
  let cancelled = false;
  let skipped = false;

  /**
   * Skip handler: reveal every paragraph at once and stop the typing loop.
   * Triggered by a click on the typing area OR any keydown. One-shot: removes
   * both listeners on first fire so a later keypress can't re-trigger.
   */
  function skipTyping() {
    if (skipped || cancelled) return;
    skipped = true;

    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    // Render the full text in one go. Paragraphs carry trusted inline HTML
    // (e.g. <span class="cn">…</span> no-break groups), so insert directly.
    element.innerHTML = paragraphs
      .map((p) => `<p class="dialog-line" aria-hidden="true">${p}</p>`)
      .join('');

    // Listeners are one-shot: remove both so a stray keypress after skip
    // doesn't do anything.
    element.removeEventListener('click', skipTyping);
    document.removeEventListener('keydown', skipTyping);
  }

  // Wire up skip on first interaction. once:true would auto-remove each
  // listener individually, but we want a single fire to clean up *both*,
  // so we remove them manually inside skipTyping.
  element.addEventListener('click', skipTyping);
  document.addEventListener('keydown', skipTyping);

  let currentParagraph = 0;
  let charSpans = [];
  let charIdx = 0;

  /**
   * Start typing paragraph idx: render its full HTML in one shot, then wrap
   * every non-space character in a .tw-dchar span (initial opacity:0) and
   * begin the reveal loop.
   * @param {number} idx - paragraph index.
   */
  function startParagraph(idx) {
    if (cancelled || skipped || idx >= paragraphs.length) return;

    // 1. Render the paragraph's full HTML in one shot. All characters, .cn
    //    groups, and <br> line breaks are in the DOM from this moment on, so
    //    the browser computes the final layout once — positions never shift
    //    as we reveal characters later.
    const p = document.createElement('p');
    p.className = 'dialog-line';
    p.setAttribute('aria-hidden', 'true');
    p.innerHTML = paragraphs[idx];
    element.appendChild(p);

    // 2. Walk every text node in the rendered paragraph and wrap each
    //    non-space character in a .tw-dchar span (initial opacity:0 via CSS).
    //    Spaces stay as live text nodes so the paragraph can wrap naturally.
    //    A snapshot of text nodes is taken first because we mutate the tree
    //    (replaceChild) as we go — walking a mutating tree is undefined.
    charSpans = [];
    charIdx = 0;
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) textNodes.push(node);
    textNodes.forEach((textNode) => {
      const text = textNode.textContent || '';
      const parent = textNode.parentNode;
      const frag = document.createDocumentFragment();
      for (const ch of text) {
        if (ch === ' ') {
          // Live space text node → natural word-wrap opportunity.
          frag.appendChild(document.createTextNode(' '));
        } else {
          const span = document.createElement('span');
          span.className = 'tw-dchar';
          span.textContent = ch;
          frag.appendChild(span);
          charSpans.push(span);
        }
      }
      parent.replaceChild(frag, textNode);
    });

    // 3. Begin the per-character reveal loop.
    revealNext();
  }

  /**
   * Reveal the next .tw-dchar span by adding the .shown class (CSS drives
   * opacity 0→1 + the 0.6s afterglow). When the paragraph is done, pause
   * briefly then start the next paragraph.
   */
  function revealNext() {
    if (cancelled || skipped) return;

    if (charIdx >= charSpans.length) {
      // Paragraph done — pause, then move on to the next (if any).
      currentParagraph++;
      if (currentParagraph < paragraphs.length) {
        timer = setTimeout(
          () => startParagraph(currentParagraph),
          DIALOG_PARAGRAPH_PAUSE
        );
      }
      return;
    }

    charSpans[charIdx].classList.add('shown');
    charIdx++;
    timer = setTimeout(revealNext, DIALOG_TYPE_SPEED);
  }

  startParagraph(0);

  return function destroy() {
    cancelled = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    // Remove skip listeners so a later keypress/click on the element doesn't
    // fire a no-op skipTyping against a destroyed instance.
    element.removeEventListener('click', skipTyping);
    document.removeEventListener('keydown', skipTyping);
  };
}
