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
  preload: false, // preload 비활성화로 경고 제거
  fallback: ['system-ui', 'arial'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // preload 비활성화로 경고 제거
  fallback: ['monospace', 'Courier New'],
});

const themeInitializer = `(function() {
  const storageKey = 'theme';
  const classNameDark = 'dark';
  const root = document.documentElement;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

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
      /* noop */
    }
  }
})();`;

// 기본 메타데이터 (설정값이 없을 때 사용)
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10b981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#ef4444',
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
