'use client';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
/**
 * @interface LazyImageProps
 * @description Next.js 이미지의 지연 로딩 동작과 표시 방식을 제어하는 속성입니다.
 * @property {string} src 이미지 리소스의 URL.
 * @property {string} alt 접근성을 위한 대체 텍스트.
 * @property {number} [width] `fill`을 사용하지 않을 때의 가로 크기(px).
 * @property {number} [height] `fill`을 사용하지 않을 때의 세로 크기(px).
 * @property {string} [className] 래퍼 컨테이너에 추가할 클래스명.
 * @property {boolean} [priority] 지연 로딩을 건너뛰고 즉시 로드할지 여부.
 * @property {'blur' | 'empty'} [placeholder] 로딩 전 플레이스홀더 전략.
 * @property {string} [blurDataURL] 블러 플레이스홀더에 사용할 데이터 URL.
 * @property {string} [sizes] `next/image`에 전달할 반응형 sizes 속성.
 * @property {number} [quality] `next/image`에서 사용할 JPEG 품질.
 * @property {boolean} [fill] 이미지가 컨테이너를 가득 채울지 여부.
 * @property {React.CSSProperties} [style] 래퍼 요소에 적용할 인라인 스타일.
 * @property {() => void} [onLoad] 이미지 로드 완료 후 호출되는 콜백.
 * @property {() => void} [onError] 이미지 로드 실패 시 호출되는 콜백.
 */
interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}
/**
 * @component LazyImage
 * @description 뷰포트 근처에서 로드하도록 최적화되고 스켈레톤 플레이스홀더를 제공하는 이미지 컴포넌트입니다.
 * @param {LazyImageProps} props 이미지 소스, 크기, 콜백 등을 담은 설정.
 * @returns {JSX.Element} 지연 로딩 이미지 또는 플레이스홀더를 포함한 래퍼 요소.
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  quality = 75,
  fill = false,
  style,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (priority || isInView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    return () => observer.disconnect();
  }, [priority, isInView]);
  /**
   * @function handleLoad
   * @description 이미지가 로드되었음을 표시하고 전달된 콜백을 실행합니다.
   * @returns {void}
   */
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };
  /**
   * @function handleError
   * @description 이미지 로드에 실패했음을 외부에 알립니다.
   * @returns {void}
   */
  const handleError = () => {
    onError?.();
  };
  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {isInView ? (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          sizes={sizes}
          quality={quality}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        <div
          className="bg-slate-200 dark:bg-slate-700 animate-pulse"
          style={{
            width: fill ? '100%' : width,
            height: fill ? '100%' : height,
          }}
        />
      )}
    </div>
  );
};
export default LazyImage;
