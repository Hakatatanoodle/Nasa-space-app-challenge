/* File: js/ui/domElements.js
 * Owner: Person B (Saurav)
 * AI-assisted: YES — Gemini, 2026-11-15. Reviewed by a human: YES, Person C (Yochan).
 * AI-assisted (update): Claude, 2026-11-15 - added escapeHtml(). Reviewed by a human: YES, Person C (Yochan).
 * Sources used: none
 */

export const $ = selector => document.querySelector(selector); export const $$ = selector => document.querySelectorAll(selector);

export const toPercent = value => Math.round(value * 100);
export const formatNumber = value => Math.round(value).toLocaleString();
export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Escapes text that came from the player, localStorage or a share code before it goes into an innerHTML template.
const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = str => String(str ?? '').replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);

export function showToast(message) {
  const toastEl = $('#toast');
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(showToast.timerId);
  showToast.timerId = setTimeout(() => {
    toastEl.hidden = true;
  }, 3000);
}