// 성능 최적화 유틸리티

/**
 * 디바운스 함수 - 연속된 호출을 지연시켜 성능 최적화
 */
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

/**
 * 쓰로틀 함수 - 일정 시간 간격으로만 함수 실행
 */
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

/**
 * 가상 스크롤링을 위한 아이템 높이 계산
 */
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

/**
 * 이미지 지연 로딩을 위한 Intersection Observer 설정
 */
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

/**
 * 메모리 사용량 모니터링
 */
export function getMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as { memory: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    } }).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
    };
  }
  return null;
}

/**
 * 성능 메트릭 수집
 */
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

/**
 * 비동기 성능 측정
 */
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

/**
 * 컴포넌트 리렌더링 최적화를 위한 메모이제이션
 */
export function memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // 캐시 크기 제한 (메모리 누수 방지)
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
}

/**
 * 배치 업데이트를 위한 스케줄러
 */
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

/**
 * 리소스 프리로딩
 */
export function preloadResource(href: string, as: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * 이미지 프리로딩
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 폰트 프리로딩
 */
export function preloadFont(href: string, _type: string = 'font/woff2') {
  preloadResource(href, 'font');
  
  // 폰트 로딩 최적화
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = new URL(href).origin;
  document.head.appendChild(link);
}

/**
 * 코드 스플리팅을 위한 동적 임포트 헬퍼
 */
export function dynamicImport<T>(importFn: () => Promise<T>) {
  return importFn().catch(error => {
    console.error('동적 임포트 실패:', error);
    throw error;
  });
}
