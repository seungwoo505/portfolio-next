"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
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
 * @returns {JSX.Element} 개인 정보가 존재하면 해당 내용으로 채워진 애니메이션 푸터를 반환합니다.
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
          const personalResponse = await api.get<PersonalInfo>('/personal-info');
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
  return (
    <motion.footer 
      className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 overflow-x-hidden"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center space-x-4">
              <Link href="/" prefetch={false}>
                <h1 
                  className="text-xl font-bold"
                  style={{
                    background: 'linear-gradient(to right, #2563eb, #9333ea)',
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
          </motion.div>
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">빠른 링크</h4>
            <div className="space-y-2">
              <Link href="/about" prefetch={false} className="block text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">
                소개
              </Link>
              <Link href="/projects" prefetch={false} className="block text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">
                프로젝트
              </Link>
              <Link href="/blog" prefetch={false} className="block text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">
                블로그
              </Link>
              <Link href="/contact" prefetch={false} className="block text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">
                연락처
              </Link>
              <Link href="/admin" prefetch={false} className="block text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-xs">
                관리자
              </Link>
            </div>
          </motion.div>
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">연락처</h4>
            <div className="space-y-2">
              {personalInfo.email && (
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  이메일: {personalInfo.email}
                </p>
              )}
              <div className="flex space-x-4">
                {personalInfo.github_url && (
                  <motion.a
                    href={personalInfo.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="GitHub 프로필"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </motion.a>
                )}
                {personalInfo.linkedin_url && (
                  <motion.a
                    href={personalInfo.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="LinkedIn 프로필"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </motion.a>
                )}
                {personalInfo.twitter_url && (
                  <motion.a
                    href={personalInfo.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Twitter 프로필"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </motion.a>
                )}
                {personalInfo.instagram_url && (
                  <motion.a
                    href={personalInfo.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Instagram 프로필"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.928-.875-1.418-2.026-1.418-3.323s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244z"/>
                    </svg>
                  </motion.a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
        <motion.div 
          className="border-t border-slate-200 dark:border-slate-700 mt-8 pt-8 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="text-slate-500 dark:text-slate-500 text-sm">
            © {currentYear} 승우.dev. 모든 권리 보유.
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
}
