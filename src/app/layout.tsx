import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AdminProvider } from '@/contexts/AdminContext';
import ConditionalLayout from '@/components/ConditionalLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: false, 
  fallback: ['system-ui', 'arial'],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, 
  fallback: ['monospace', 'Courier New'],
});
const themeInitializer = `(function() {
  const storageKey = 'theme';
  const classNameDark = 'dark';
  const root = document.documentElement;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  /**
   * @description 테마를 적용합니다.
    * @param {*} mode 입력값
   * @returns {any} 처리 결과
   */
  function applyTheme(mode) {
    const isDark = mode === 'dark';
    root.classList.remove(classNameDark);
    if (isDark) {
      root.classList.add(classNameDark);
    }
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    root.style.setProperty('--background', isDark ? '#0a0a0a' : '#ffffff');
    root.style.setProperty('--foreground', isDark ? '#ededed' : '#171717');
    root.style.colorScheme = isDark ? 'dark' : 'light';
    root.style.backgroundColor = isDark ? '#0a0a0a' : '#ffffff';
    root.style.color = isDark ? '#ededed' : '#171717';
  }
  /**
   * @description 저장된 테마 값을 가져옵니다.
   * @returns {any} 처리 결과
   */
  function getStoredTheme() {
    try {
      return window.localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  }
  const savedTheme = getStoredTheme();
  const initialMode = savedTheme ? savedTheme : (prefersDark ? 'dark' : 'light');
  applyTheme(initialMode);
  if (!savedTheme) {
    try {
      window.localStorage.setItem(storageKey, initialMode);
    } catch {
    }
  }
})();`;
export const metadata: Metadata = {
  title: "포트폴리오 | 웹 개발자",
  description: "웹 개발자 포트폴리오입니다.",
  keywords: "개발자,포트폴리오,웹개발,프론트엔드,백엔드",
  authors: [{ name: "개발자" }],
  creator: "개발자",
  publisher: "개발자",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "승우 포트폴리오 | 웹 개발자",
    description: "풀스택 웹 개발자 승우의 포트폴리오",
    type: "website",
  },
};
/**
 * @component RootLayout
 * @description 전역 프로바이더와 테마 초기화 스크립트, 공통 레이아웃을 적용한 루트 레이아웃입니다.
 * @param {{ children: React.ReactNode }} param0 현재 라우트 세그먼트를 나타내는 자식 요소.
 * @returns {JSX.Element} Next.js 앱 라우터에 사용되는 HTML 문서 구조를 반환합니다.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 정적 export를 사용하므로 서버에서 쿠키를 읽을 수 없음
  // 클라이언트에서 themeInitializer 스크립트가 data-theme을 설정함
  return (
    <html lang="ko" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          id="theme-initializer"
          dangerouslySetInnerHTML={{ __html: themeInitializer }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AdminProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(15, 23, 42, 0.94)',
                border: '1px solid rgba(148, 163, 184, 0.28)',
                borderRadius: '14px',
                boxShadow: '0 20px 45px rgba(15, 23, 42, 0.35)',
                color: '#fff',
                maxWidth: '360px',
                padding: '12px 14px',
              },
              success: {
                duration: 3000,
                style: {
                  background: 'rgba(6, 95, 70, 0.96)',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: 'rgba(127, 29, 29, 0.96)',
                },
              },
            }}
          />
        </AdminProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
