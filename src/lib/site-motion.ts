const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const SITE_ENTRANCE_ANIMATION_ID = 'site-entrance';

/** Progressive enhancement: no hidden styles or deferred rendering are required. */
export function startSiteMotion(root: HTMLElement): () => void {
  if (typeof window === 'undefined' || !window.matchMedia || typeof IntersectionObserver === 'undefined' || typeof MutationObserver === 'undefined') return () => {};

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const seen = new WeakSet<Element>();
  const pending = new Set<HTMLElement>();
  const running = new Map<HTMLElement, Animation>();
  let stopped = false;
  let reduced = preference.matches || Boolean(root.closest?.('.reduced-motion'));

  function finishObserving(target: HTMLElement) {
    seen.add(target);
    pending.delete(target);
    intersection.unobserve(target);
  }

  function cancel(target: HTMLElement) {
    running.get(target)?.cancel();
    running.delete(target);
  }

  function play(target: HTMLElement, entering: boolean) {
    if (reduced || stopped || typeof target.animate !== 'function' || target.contains(root.ownerDocument?.activeElement ?? null)) return;
    if (entering && target.closest?.('[data-layout-animating]')) return;
    const frames: Keyframe[] = entering
      ? [{ opacity: 0.6, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0px)' }]
      : [{ opacity: 0.65 }, { opacity: 1 }];
    const animation = target.animate(frames, { duration: entering ? 380 : 160, easing: EASING });
    if (entering) animation.id = SITE_ENTRANCE_ANIMATION_ID;
    running.set(target, animation);
    const release = () => { if (running.get(target) === animation) running.delete(target); };
    animation.addEventListener('finish', release, { once: true });
    animation.addEventListener('cancel', release, { once: true });
  }

  const intersection = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const target = entry.target as HTMLElement;
      if (stopped || !entry.isIntersecting || seen.has(target)) continue;
      const rect = target.getBoundingClientRect();
      if (!root.contains(target) || rect.bottom <= 0) { finishObserving(target); continue; }
      // A fast scroll can make an observer entry stale before it is delivered.
      if (rect.top >= window.innerHeight) continue;
      finishObserving(target);
      play(target, true);
    }
  }, { threshold: 0 });

  function scan(dynamic: boolean) {
    for (const target of pending) if (!root.contains(target)) { pending.delete(target); intersection.unobserve(target); }
    for (const target of running.keys()) if (!root.contains(target)) cancel(target);
    for (const target of root.querySelectorAll<HTMLElement>('[data-reveal]')) {
      if (seen.has(target) || pending.has(target)) continue;
      const rect = target.getBoundingClientRect();
      if (reduced || rect.bottom <= 0 || typeof target.animate !== 'function') { seen.add(target); continue; }
      if (rect.top < window.innerHeight) { seen.add(target); if (dynamic) play(target, false); }
      else { pending.add(target); intersection.observe(target); }
    }
  }

  function syncPreference() {
    reduced = preference.matches || Boolean(root.closest?.('.reduced-motion'));
    if (reduced) {
      for (const target of running.keys()) cancel(target);
      for (const target of pending) seen.add(target);
      pending.clear();
      intersection.disconnect();
    }
    scan(false);
  }

  function onFocus(event: Event) {
    const focused = event.target as Node | null;
    for (const target of running.keys()) if (target.contains(focused)) cancel(target);
    for (const target of pending) if (target.contains(focused)) finishObserving(target);
  }

  const mutation = new MutationObserver(records => {
    if (stopped) return;
    if (records.some(record => record.type === 'attributes')) syncPreference();
    if (records.some(record => record.type !== 'attributes')) scan(true);
  });
  scan(false);
  mutation.observe(root, { childList: true, subtree: true });
  if (root.ownerDocument?.documentElement) mutation.observe(root.ownerDocument.documentElement, { attributes: true, attributeFilter: ['class'] });
  root.addEventListener('focusin', onFocus);
  preference.addEventListener?.('change', syncPreference);

  return () => {
    stopped = true;
    intersection.disconnect();
    mutation.disconnect();
    preference.removeEventListener?.('change', syncPreference);
    root.removeEventListener('focusin', onFocus);
    for (const target of running.keys()) cancel(target);
    pending.clear();
  };
}
