"use client";
import Link from "next/link";
import { Github, Instagram, Linkedin, Twitter } from "lucide-react";
import { useState, useEffect } from "react";
import { api, personalApi } from "@/lib/api";

interface PersonalInfo {
  full_name?: string;
  title?: string;
  bio?: string;
  about?: string;
  email?: string;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  instagram_url?: string;
}

const FOOTER_FALLBACK_DESCRIPTION =
  'Next.js와 TypeScript로 빠르고 안정적인 웹 경험을 설계합니다.';

/**
 * @component Footer
 * @description 빠른 링크, 연락처, 소셜 정보가 포함된 사이트 푸터를 렌더링합니다.
 * @returns {JSX.Element} 개인 정보가 존재하면 해당 내용으로 채워진 푸터를 반환합니다.
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({});

  useEffect(() => {
    /**
     * @function fetchPersonalInfo
     * @description 개인 정보와 설정값을 불러와 푸터에 표시할 내용을 구성합니다.
     * @returns {Promise<void>} API 데이터와 동기화가 완료되면 해결됩니다.
     */
    const fetchPersonalInfo = async () => {
      try {
        const settingsResponse = await api.get<{ [key: string]: string }>('/settings');
        let settingsPersonalInfo = {};
        if (settingsResponse.success && settingsResponse.data) {
          const settings = settingsResponse.data;
          settingsPersonalInfo = {
            full_name: settings.personal_name || settings.intro_name || '',
            title: settings.personal_title || settings.intro_title || '',
            bio: settings.personal_bio || settings.intro_bio || '',
            about: settings.personal_about || settings.intro_about || '',
            email: settings.personal_email || settings.intro_email || '',
            github_url: settings.personal_github_url || settings.intro_github_url || '',
            linkedin_url: settings.personal_linkedin_url || settings.intro_linkedin_url || '',
            twitter_url: settings.personal_twitter_url || settings.intro_twitter_url || '',
            instagram_url: settings.personal_instagram_url || settings.intro_instagram_url || ''
          };
        }

        let personalTableInfo = {};
        try {
          const personalResponse = await personalApi.getPersonalInfo();
          if (personalResponse.success && personalResponse.data) {
            personalTableInfo = personalResponse.data;
          }
        } catch {
        }

        setPersonalInfo({
          ...personalTableInfo,
          ...settingsPersonalInfo
        });
      } catch {
      }
    };

    fetchPersonalInfo();
  }, []);

  const socialLinks = [
    { url: personalInfo.github_url, label: "GitHub 프로필", Icon: Github },
    { url: personalInfo.linkedin_url, label: "LinkedIn 프로필", Icon: Linkedin },
    { url: personalInfo.twitter_url, label: "Twitter 프로필", Icon: Twitter },
    { url: personalInfo.instagram_url, label: "Instagram 프로필", Icon: Instagram },
  ];

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="site-container py-12 sm:py-16">
        <div className="flex flex-col justify-between gap-10 sm:flex-row sm:gap-16">
          <div className="max-w-sm">
            <Link href="/" prefetch={false} className="text-lg font-semibold tracking-tight">승우<span className="muted-text font-normal">.dev</span></Link>
            <p className="muted-text mt-4 text-sm leading-7">{personalInfo.bio || personalInfo.about || FOOTER_FALLBACK_DESCRIPTION}</p>
            {personalInfo.email && <a href={`mailto:${personalInfo.email}`} className="text-link mt-5 break-all">{personalInfo.email}</a>}
          </div>
          <div className="flex gap-12 sm:gap-16">
            <nav aria-label="푸터 메뉴" className="grid content-start gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <Link href="/projects" prefetch={false} className="hover:text-teal-700 dark:hover:text-teal-300">프로젝트</Link>
              <Link href="/about" prefetch={false} className="hover:text-teal-700 dark:hover:text-teal-300">소개</Link>
              <Link href="/blog" prefetch={false} className="hover:text-teal-700 dark:hover:text-teal-300">블로그</Link>
              <Link href="/contact" prefetch={false} className="hover:text-teal-700 dark:hover:text-teal-300">연락처</Link>
            </nav>
            {socialLinks.some(link => link.url) && <div>
              <p className="mb-4 text-xs font-medium text-zinc-400">다른 곳에서도 만나요</p>
              <div className="flex flex-wrap gap-2">{socialLinks.map(({ url, label, Icon }) => url && <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="icon-button" aria-label={label}><Icon size={16} aria-hidden="true" /></a>)}</div>
            </div>}
          </div>
        </div>
        <div className="muted-text mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 pt-6 text-xs dark:border-zinc-800">
          <p>© {currentYear} 승우.dev</p><Link href="/admin" prefetch={false} className="min-h-10 content-center hover:text-teal-700 dark:hover:text-teal-300">관리자</Link>
        </div>
      </div>
    </footer>
  );
}
