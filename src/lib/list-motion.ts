import { SITE_ENTRANCE_ANIMATION_ID } from './site-motion';

type Position = { element: HTMLElement; left: number; top: number };

/** Only retained DOM cards move. Rendering, order, and new-card opacity remain immediate. */
export function startListMotion(root: HTMLElement): { update: () => void; stop: () => void } {
  if (typeof window === 'undefined') return { update() {}, stop() {} };
  const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const running = new Map<HTMLElement, Animation>();
  let stopped = false;
  let previous = measure();
  let width = root.clientWidth;

  function measure(): Map<string, Position> {
    const positions = new Map<string, Position>();
    for (const child of Array.from(root.children)) {
      const element = child as HTMLElement;
      const id = element.dataset?.layoutId;
      if (!id) continue;
      const rect = element.getBoundingClientRect();
      positions.set(id, { element, left: rect.left + window.scrollX, top: rect.top + window.scrollY });
    }
    return positions;
  }

  function clear() {
    const animations = [...running.values()];
    running.clear();
    for (const animation of animations) animation.cancel();
    delete root.dataset.layoutAnimating;
  }

  function refresh() {
    if (stopped) return;
    clear();
    previous = measure();
  }

  function reduced() {
    return preference?.matches || Boolean(root.closest('.reduced-motion'));
  }

  function update() {
    if (stopped) return;
    // A retained card gives layout movement priority over its scroll entrance.
    // Cancel only that owned entrance before measuring the unshifted layout.
    for (const child of Array.from(root.children)) {
      const element = child as HTMLElement;
      if (!element.dataset?.layoutId) continue;
      for (const animation of element.getAnimations?.() ?? []) {
        if (animation.id === SITE_ENTRANCE_ANIMATION_ID) animation.cancel();
      }
    }
    // Existing translations are sampled before cancellation. This keeps repeated
    // filters continuous even when React has already committed the new layout.
    const displayed = measure();
    const active = new Set(running.keys());
    clear();
    const next = measure();
    if (!reduced()) {
      for (const [id, target] of next) {
        const origin = previous.get(id);
        if (!origin || origin.element !== target.element || typeof target.element.animate !== 'function') continue;
        if (target.element.contains(root.ownerDocument?.activeElement ?? null)) continue;
        const visual = active.has(target.element) ? displayed.get(id) : undefined;
        const left = origin.left + (visual ? visual.left - target.left : 0) - target.left;
        const top = origin.top + (visual ? visual.top - target.top : 0) - target.top;
        if (Math.abs(left) < .5 && Math.abs(top) < .5) continue;
        root.dataset.layoutAnimating = 'true';
        const animation = target.element.animate([
          { transform: `translate(${left}px, ${top}px)` },
          { transform: 'translate(0px, 0px)' },
        ], { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
        running.set(target.element, animation);
        const release = () => {
          if (running.get(target.element) !== animation) return;
          running.delete(target.element);
          if (!running.size) delete root.dataset.layoutAnimating;
        };
        animation.addEventListener('finish', release, { once: true });
        animation.addEventListener('cancel', release, { once: true });
      }
    }
    previous = next;
  }

  function onPreference() { if (reduced()) refresh(); }
  function onResize() {
    if (root.clientWidth === width) return;
    width = root.clientWidth;
    refresh();
  }
  const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
  resize?.observe(root);
  const classes = typeof MutationObserver === 'undefined' ? null : new MutationObserver(onPreference);
  // Ancestors may opt into reduced motion independently of the operating system.
  for (const ancestor of [root.ownerDocument?.documentElement, root.ownerDocument?.body]) {
    if (ancestor) classes?.observe(ancestor, { attributes: true, attributeFilter: ['class'], subtree: true });
  }
  window.addEventListener('resize', refresh);
  root.addEventListener('focusin', refresh);
  preference?.addEventListener?.('change', onPreference);

  return {
    update,
    stop() {
      stopped = true;
      clear();
      previous.clear();
      resize?.disconnect();
      classes?.disconnect();
      window.removeEventListener('resize', refresh);
      root.removeEventListener('focusin', refresh);
      preference?.removeEventListener?.('change', onPreference);
    },
  };
}
