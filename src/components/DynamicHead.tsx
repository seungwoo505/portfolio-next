'use client';

import { useEffect, useState } from 'react';
import Head from 'next/head';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { SiteSettings } from '@/types';

interface DynamicHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  pageTitle?: string;
}

export default function DynamicHead({
  title,
  description,
  keywords,
  author,
  pageTitle
}: DynamicHeadProps) {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get<{ data: SiteSettings }>('/settings');
        if (response.data?.data) {
          setSettings(response.data.data);
        }
      } catch {
        toast.error('설정을 가져오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // 설정값과 props를 결합하여 최종값 결정
  const finalTitle = pageTitle 
    ? `${pageTitle} | ${settings?.site_title || '승우 포트폴리오'}`
    : settings?.site_title || title || '승우 포트폴리오 | 웹 개발자';
    
  const finalDescription = settings?.site_description || description || '풀스택 웹 개발자 승우의 포트폴리오';
  const finalKeywords = settings?.meta_keywords || keywords || '개발자,포트폴리오,웹개발,프론트엔드,백엔드';
  const finalAuthor = settings?.meta_author || author || '승우';

  // CSS 변수로 색상 테마 적용
  useEffect(() => {
    if (settings?.primary_color) {
      document.documentElement.style.setProperty('--custom-primary-color', settings.primary_color);
      document.documentElement.setAttribute('data-theme', 'custom');
    }
    if (settings?.secondary_color) {
      document.documentElement.style.setProperty('--custom-secondary-color', settings.secondary_color);
      document.documentElement.setAttribute('data-theme', 'custom');
    }
    if (settings?.font_family) {
      document.documentElement.style.setProperty('--custom-font-family', settings.font_family);
      document.documentElement.setAttribute('data-theme', 'custom');
    }
  }, [settings]);

  // 다크모드 적용
  useEffect(() => {
    if (settings?.dark_mode !== undefined) {
      if (settings?.dark_mode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings?.dark_mode]);

  if (loading) {
    return null; // 로딩 중에는 기본 메타데이터 사용
  }

  return (
    <Head>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="author" content={finalAuthor} />
      
      {/* Open Graph */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={settings?.site_title || '승우 포트폴리오'} />
      <meta property="og:locale" content="ko_KR" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:creator" content="@seungwoo_dev" />
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      {/* 사파리 호환성을 위한 추가 메타 태그 */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="format-detection" content="date=no" />
      <meta name="format-detection" content="address=no" />
      <meta name="format-detection" content="email=no" />
      
      {/* Performance */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta property="og:type" content="website" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      
      {/* 추가 메타 태그들 */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      
      {/* 설정된 색상이 있으면 테마 컬러 적용 */}
      {settings?.primary_color && (
        <meta name="theme-color" content={settings?.primary_color} />
      )}
    </Head>
  );
}
