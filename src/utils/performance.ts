export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
export function calculateVirtualScrollItems(
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  scrollTop: number
) {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, totalItems);
  return {
    startIndex,
    endIndex,
    visibleCount,
    totalHeight: totalItems * itemHeight,
    offsetY: startIndex * itemHeight,
  };
}
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };
  return new IntersectionObserver(callback, defaultOptions);
}
export function getMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as { memory: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    } }).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), 
      total: Math.round(memory.totalJSHeapSize / 1048576), 
      limit: Math.round(memory.jsHeapSizeLimit / 1048576), 
    };
  }
  return null;
}
export function measurePerformance(name: string, fn: () => void): number {
  const start = performance.now();
  fn();
  const end = performance.now();
  const duration = end - start;
  if (process.env.NODE_ENV === 'development') {
    console.log(`${name} 실행 시간: ${duration.toFixed(2)}ms`);
  }
  return duration;
}
export async function measureAsyncPerformance<T>(
  name: string, 
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;
  if (process.env.NODE_ENV === 'development') {
    console.log(`${name} 실행 시간: ${duration.toFixed(2)}ms`);
  }
  return result;
}
export function memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const cache = new Map();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    return result;
  }) as T;
}
export class BatchScheduler {
  private queue: (() => void)[] = [];
  private isScheduled = false;
  schedule(callback: () => void) {
    this.queue.push(callback);
    if (!this.isScheduled) {
      this.isScheduled = true;
      requestAnimationFrame(() => {
        this.flush();
      });
    }
  }
  private flush() {
    const callbacks = this.queue.splice(0);
    callbacks.forEach(callback => callback());
    this.isScheduled = false;
  }
}
export function preloadResource(href: string, as: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}
export function preloadFont(href: string, _type: string = 'font/woff2') {
  preloadResource(href, 'font');
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = new URL(href).origin;
  document.head.appendChild(link);
}
export function dynamicImport<T>(importFn: () => Promise<T>) {
  return importFn().catch(error => {
    console.error('동적 임포트 실패:', error);
    throw error;
  });
}
