/** Respect both the operating system and the site's reduced-motion setting. */
export function scrollToPageStart() {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
    (typeof document !== 'undefined' && document.documentElement.classList.contains('reduced-motion'));
  window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
}
