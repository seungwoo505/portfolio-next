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
    <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center space-x-4">
              <Link href="/" prefetch={false}>
                <h1
                  className="text-xl font-bold"
                  style={{
                    background: 'linear-gradient(to right, #0f172a, #059669)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent'
                  }}
                >
                  승우.dev
                </h1>
              </Link>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {personalInfo.bio || personalInfo.about || FOOTER_FALLBACK_DESCRIPTION}
            </p>
          </div>

          <div className="space-y-4 animate-fade-in-up">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">빠른 링크</h4>
            <div className="space-y-2">
              <Link href="/about" prefetch={false} className="block text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors text-sm">
                소개
              </Link>
              <Link href="/projects" prefetch={false} className="block text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors text-sm">
                프로젝트
              </Link>
              <Link href="/blog" prefetch={false} className="block text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors text-sm">
                블로그
              </Link>
              <Link href="/contact" prefetch={false} className="block text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors text-sm">
                연락처
              </Link>
              <Link href="/admin" prefetch={false} className="block text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-xs">
                관리자
              </Link>
            </div>
          </div>

          <div className="space-y-4 animate-fade-in-up">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">연락처</h4>
            <div className="space-y-2">
              {personalInfo.email && (
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  이메일: {personalInfo.email}
                </p>
              )}
              <div className="flex space-x-4">
                {socialLinks.map(({ url, label, Icon }) => (
                  url && (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition duration-200 hover:scale-110 active:scale-95"
                      aria-label={label}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 mt-8 pt-8 text-center animate-fade-in-up">
          <p className="text-slate-500 dark:text-slate-500 text-sm">
            © {currentYear} 승우.dev. 모든 권리 보유.
          </p>
        </div>
      </div>
    </footer>
  );
}
