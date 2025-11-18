import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 정적 사이트 생성을 위한 설정
  output: 'export',
  trailingSlash: true,
  
  // 고성능 최적화
  experimental: {
    optimizePackageImports: [
      'framer-motion', 
      'lucide-react', 
      '@heroicons/react',
      'react-hot-toast',
      'date-fns'
    ],
    // 추가 실험적 최적화 (안정적인 것만)
    webpackBuildWorker: true, // 웹팩 빌드 워커 활성화
  },
  
  // 이미지 설정 (정적 export용) - 고성능 최적화
  images: {
    unoptimized: true, // 정적 export 시 이미지 최적화 비활성화
    formats: ['image/webp', 'image/avif'], // 최신 포맷 우선
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 추가 이미지 최적화
    minimumCacheTTL: 31536000, // 1년 캐시 TTL
    dangerouslyAllowSVG: true, // SVG 허용
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // 압축 설정 - 고성능 최적화
  compress: true,
  
  // 웹팩 최적화
  webpack: (config: any, { isServer }) => {
    // 프로덕션 최적화
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // 벤더 청크 최적화
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              chunks: 'all',
            },
            // 공통 컴포넌트 청크
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              chunks: 'all',
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    // 번들 분석기 (개발 시에만)
    if (process.env.ANALYZE === 'true') {
      config.plugins.push(
        new (require('@next/bundle-analyzer'))({
          enabled: true,
        })
      );
    }
    
    return config;
  },
  
  // 컴파일러 최적화
  compiler: {
    // React 컴파일러 최적화
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // 보안 헤더는 정적 export에서 지원되지 않음
  // 웹 서버(nginx, Apache 등)에서 설정해야 함
};

export default nextConfig;
