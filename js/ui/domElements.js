/* File: js/ui/domElements.js
 * Owner: Person B (Saurav)
 * AI-assisted: YES — Gemini, 2026-11-14. Reviewed by a human: YES Reviewd by Person C (Yochan)
 * Sources used: none
 */

export const $ = selector => document.querySelector(selector);
export const $$ = selector => document.querySelectorAll(selector);

export const toPercent = value => Math.round(value * 100);
export const formatNumber = value => Math.round(value).toLocaleString();
export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export function showToast(message) {
  const toastEl = $('#toast');
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(showToast.timerId);
  showToast.timerId = setTimeout(() => {
    toastEl.hidden = true;
  }, 3000);
}