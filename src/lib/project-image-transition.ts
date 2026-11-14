const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

/** This only adds a visual layer. The anchor and Next router still own navigation. */
export function canAnimateProjectLink(event: MouseEvent, anchor: HTMLAnchorElement, origin: string): boolean {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return false;
  try {
    const url = new URL(anchor.href, origin);
    const parts = url.pathname.split('/');
    return url.origin === origin && !url.hash && parts.length === 3 && parts[1] === 'projects' && Boolean(anchor.dataset.projectLink) && decodeURIComponent(parts[2]) === anchor.dataset.projectLink;
  } catch { return false; }
}

type ImageRole = 'list' | 'detail';
type PendingImage = {
  key: string;
  role: ImageRole;
  overlay: HTMLDivElement;
  image: HTMLImageElement;
  imageAnimation?: Animation;
  source: DOMRect;
  startedAt: number;
  sourcePath: string;
  timer: number;
  frames: number[];
  restore: () => void;
  animation?: Animation;
  preparing: boolean;
};

export function startProjectImageTransitions(root: HTMLElement): () => void {
  if (typeof window === 'undefined' || typeof Element === 'undefined' || !Element.prototype.animate || !window.matchMedia || typeof MutationObserver === 'undefined') return () => {};
  const doc = root.ownerDocument;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pending: PendingImage | null = null;
  let stopped = false;
  const reduced = () => preference.matches || Boolean(root.closest('.reduced-motion'));

  function reset() {
    const current = pending;
    pending = null;
    if (!current) return;
    window.clearTimeout(current.timer);
    current.frames.forEach(frame => window.cancelAnimationFrame(frame));
    current.imageAnimation?.cancel();
    current.animation?.cancel();
    current.restore();
    current.overlay.remove();
  }

  function imageAt(container: HTMLElement): HTMLImageElement | null {
    const image = container.querySelector('img');
    return image?.complete && image.naturalWidth > 0 && (image.currentSrc || image.src) ? image : null;
  }

  function visible(container: HTMLElement) {
    const rect = container.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
  }

  function findImage(key: string, role: ImageRole, scope: ParentNode = root): HTMLElement | undefined {
    return [...scope.querySelectorAll<HTMLElement>('[data-project-image]')].find(element => element.dataset.projectImage === key && element.dataset.projectImageRole === role);
  }

  function prepareTarget() {
    const current = pending;
    if (!current || reduced() || stopped) return;
    const path = window.location.pathname;
    let destinationMatches = current.role === 'list' && (path === '/' || path === '/projects');
    if (current.role === 'detail') {
      const parts = path.split('/');
      try { destinationMatches = parts.length === 3 && parts[1] === 'projects' && decodeURIComponent(parts[2]) === current.key; } catch { destinationMatches = false; }
    }
    if (path !== current.sourcePath && !destinationMatches) { reset(); return; }
    if (current.preparing) return;
    const target = findImage(current.key, current.role);
    if (!target || !imageAt(target)) return;
    current.preparing = true;
    // Let the native router finish its layout and scroll restoration first.
    current.frames.push(window.requestAnimationFrame(() => {
      current.frames.push(window.requestAnimationFrame(() => {
        if (pending !== current || stopped) return;
        if (reduced() || !target.isConnected || !visible(target) || performance.now() - current.startedAt > 750) { reset(); return; }
        const rect = target.getBoundingClientRect();
        const targetImage = imageAt(target);
        if (!targetImage) { reset(); return; }
        const destinationScale = window.getComputedStyle(targetImage).scale;
        current.imageAnimation = current.image.animate([
          { scale: current.image.style.scale },
          { scale: destinationScale && destinationScale !== 'none' ? destinationScale : '1' },
        ], { duration: 380, easing: EASING, fill: 'forwards' });
        const previousOpacity = target.style.opacity;
        current.restore = () => { target.style.opacity = previousOpacity; };
        target.style.opacity = '0';
        current.animation = current.overlay.animate([
          { left: `${current.source.left}px`, top: `${current.source.top}px`, width: `${current.source.width}px`, height: `${current.source.height}px`, borderRadius: current.overlay.style.borderRadius },
          { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, borderRadius: window.getComputedStyle(target).borderRadius },
        ], { duration: 380, easing: EASING, fill: 'forwards' });
        current.animation.addEventListener('finish', () => { if (pending === current) reset(); }, { once: true });
        current.animation.addEventListener('cancel', () => { if (pending === current) reset(); }, { once: true });
      }));
    }));
  }

  function begin(source: HTMLElement, key: string, role: ImageRole) {
    reset();
    const image = imageAt(source);
    if (stopped || reduced() || !image || !visible(source)) return;
    const sourceRect = source.getBoundingClientRect();
    const overlay = doc.createElement('div');
    overlay.className = 'project-image-transition';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.inert = true;
    const sourceStyle = window.getComputedStyle(source);
    Object.assign(overlay.style, {
      position: 'fixed', left: `${sourceRect.left}px`, top: `${sourceRect.top}px`, width: `${sourceRect.width}px`, height: `${sourceRect.height}px`,
      overflow: 'hidden', pointerEvents: 'none', zIndex: '70', margin: '0', borderRadius: sourceStyle.borderRadius,
      background: sourceStyle.backgroundColor, contain: 'layout style paint',
    });
    const clone = doc.createElement('img');
    clone.src = image.currentSrc || image.src;
    clone.alt = '';
    const imageStyle = window.getComputedStyle(image);
    Object.assign(clone.style, { display: 'block', width: '100%', height: '100%', objectFit: imageStyle.objectFit, objectPosition: imageStyle.objectPosition, scale: imageStyle.scale && imageStyle.scale !== 'none' ? imageStyle.scale : '1' });
    overlay.append(clone);
    doc.body.append(overlay);
    const next: PendingImage = { key, role, overlay, image: clone, source: sourceRect, sourcePath: window.location.pathname, startedAt: performance.now(), timer: 0, frames: [], restore() {}, preparing: false };
    pending = next;
    next.timer = window.setTimeout(() => { if (pending === next) reset(); }, 1200);
    prepareTarget();
  }

  function onClick(event: MouseEvent) {
    if (!(event.target instanceof Element)) return;
    const anchor = event.target.closest<HTMLAnchorElement>('a[href]');
    if (!anchor) return;
    if (!root.contains(anchor) || !canAnimateProjectLink(event, anchor, window.location.origin)) {
      if (pending && !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && !anchor.hasAttribute('download') && (!anchor.target || anchor.target === '_self')) {
        try { if (new URL(anchor.href, window.location.origin).origin === window.location.origin) reset(); } catch { /* Keep native link handling. */ }
      }
      return;
    }
    const key = anchor.dataset.projectLink!;
    const source = findImage(key, 'list', anchor.closest('[data-project-card]') || root);
    if (source) begin(source, key, 'detail');
    // No preventDefault, router call, history mutation, or navigation delay.
  }

  function onPopState() {
    const parts = window.location.pathname.split('/');
    if (parts.length === 3 && parts[1] === 'projects') {
      let key: string;
      try { key = decodeURIComponent(parts[2]); } catch { reset(); return; }
      const source = findImage(key, 'list');
      if (source) { begin(source, key, 'detail'); return; }
    }
    if (window.location.pathname === '/' || window.location.pathname === '/projects') {
      const source = [...root.querySelectorAll<HTMLElement>('[data-project-image-role="detail"]')].find(visible);
      if (source?.dataset.projectImage) { begin(source, source.dataset.projectImage, 'list'); return; }
    }
    reset();
  }

  function onPreference() { if (reduced()) reset(); }
  function onScroll() { if (pending?.animation) reset(); else prepareTarget(); }
  function onKey(event: KeyboardEvent) { if (['Escape', 'PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp', ' '].includes(event.key)) reset(); }
  function onVisibility() { if (doc.hidden) reset(); }
  const mutation = new MutationObserver(() => { onPreference(); prepareTarget(); });
  mutation.observe(root, { childList: true, subtree: true });
  mutation.observe(doc.documentElement, { attributes: true, attributeFilter: ['class'] });
  doc.addEventListener('click', onClick, true);
  root.addEventListener('load', prepareTarget, true);
  window.addEventListener('popstate', onPopState);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('wheel', reset, { passive: true });
  window.addEventListener('touchmove', reset, { passive: true });
  window.addEventListener('resize', reset);
  doc.addEventListener('keydown', onKey);
  doc.addEventListener('visibilitychange', onVisibility);
  preference.addEventListener('change', onPreference);

  return () => {
    stopped = true;
    reset();
    mutation.disconnect();
    doc.removeEventListener('click', onClick, true);
    root.removeEventListener('load', prepareTarget, true);
    window.removeEventListener('popstate', onPopState);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('wheel', reset);
    window.removeEventListener('touchmove', reset);
    window.removeEventListener('resize', reset);
    doc.removeEventListener('keydown', onKey);
    doc.removeEventListener('visibilitychange', onVisibility);
    preference.removeEventListener('change', onPreference);
  };
}
