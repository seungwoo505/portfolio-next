import type { NextConfig } from "next";
import { getImageRemotePatterns } from "./src/lib/image-policy";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      'react-hot-toast'
    ],
    webpackBuildWorker: true, 
  },
  images: {
    remotePatterns: getImageRemotePatterns(),
    formats: ['image/webp', 'image/avif'], 
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 14400,
    dangerouslyAllowSVG: false,
    dangerouslyAllowLocalIP: process.env.NEXT_PUBLIC_ISOLATED_PREVIEW === '1',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compress: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
};
export default nextConfig;
