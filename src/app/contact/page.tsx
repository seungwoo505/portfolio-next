"use client";


import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Head from "next/head";
import { contactApi } from "@/lib/api";
import { ContactMessage } from "@/types";
import DynamicHead from "@/components/DynamicHead";
import ScrollProgress from "../../components/ScrollProgress";
import { api } from "@/lib/api";
import toast from 'react-hot-toast';
// import { generateStructuredData } from '@/lib/seo';

type SiteSettings = {
  site_title?: string;
  contact_description?: string;
  contact_enabled?: boolean;
  contact_form_name_placeholder?: string;
  contact_form_email_placeholder?: string;
  contact_form_subject_placeholder?: string;
  contact_form_message_placeholder?: string;
  contact_form_submit_text?: string;
  contact_form_success_message?: string;
  contact_form_error_message?: string;
};

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactMessage>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get<{ data: SiteSettings }>('/settings');
        if (response.data?.data) {
          setSettings(response.data.data);
        }
      } catch {
        // 설정 로딩 실패 시 기본값 사용
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await contactApi.sendMessage(formData);
      
      if (response.success) {
        toast.success(response.message || '메시지가 성공적으로 전송되었습니다!');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error(response.message || '전송 중 오류가 발생했습니다.');
      }
    } catch {
      const err = { message: '네트워크 오류가 발생했습니다.' };
      toast.error(err?.message || '네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  return (
    <>
      <Head>
        <title>연락처 | 승우의 포트폴리오</title>
        <meta name="description" content="웹 개발자 승우에게 연락하세요. 프로젝트 문의, 채용 제안, 기술 상담 등 다양한 기회를 환영합니다." />
        <meta name="keywords" content="연락처, 문의, 채용, 프로젝트, 웹개발, React, Next.js, Node.js, 개발자" />
        <meta name="author" content="승우" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="연락처 | 승우의 포트폴리오" />
        <meta property="og:description" content="웹 개발자 승우에게 연락하세요. 프로젝트 문의, 채용 제안, 기술 상담 등 다양한 기회를 환영합니다." />
        <meta property="og:url" content="https://seungwoo.i234.me/contact" />
        <meta property="og:image" content="https://seungwoo.i234.me/og-image.jpg" />
        <meta property="og:site_name" content="승우의 포트폴리오" />
        <meta property="og:locale" content="ko_KR" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="연락처 | 승우의 포트폴리오" />
        <meta name="twitter:description" content="웹 개발자 승우에게 연락하세요. 프로젝트 문의, 채용 제안, 기술 상담 등 다양한 기회를 환영합니다." />
        <meta name="twitter:image" content="https://seungwoo.i234.me/og-image.jpg" />
        <meta name="twitter:creator" content="@seungwoo" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://seungwoo.i234.me/contact" />
        
        {/* 구조화된 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ContactPage",
              "name": "연락처",
              "description": "웹 개발자 승우에게 연락하세요. 프로젝트 문의, 채용 제안, 기술 상담 등 다양한 기회를 환영합니다.",
              "url": "https://seungwoo.i234.me/contact",
              "mainEntity": {
                "@type": "Person",
                "name": "승우",
                "jobTitle": "웹 개발자",
                "description": "React, Next.js, Node.js를 활용한 웹 개발자",
                "url": "https://seungwoo.i234.me",
                "sameAs": [
                  "https://github.com/seungwoo",
                  "https://linkedin.com/in/seungwoo"
                ]
              }
            })
          }}
        />
      </Head>
      <DynamicHead pageTitle="연락처" />
      <ScrollProgress />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">


        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className="text-4xl font-extrabold text-slate-900 dark:text-white mb-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              연락처
            </motion.h1>
            <motion.p 
              className="text-lg text-slate-600 dark:text-slate-300 mb-12 text-center max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {settings?.contact_description || '궁금한 점이 있으시거나 협업을 원하시면 언제든지 메시지를 보내주세요!'}
            </motion.p>
          </motion.div>

          {settings?.contact_enabled === false ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                연락처 폼이 비활성화되었습니다
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                현재 연락처 폼을 통한 메시지 전송이 불가능합니다.
              </p>
            </div>
          ) : (
            <motion.div 
              className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.h2 
                className="text-2xl font-bold text-slate-900 dark:text-white mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
{settings.contact_form_submit_text || "메시지 보내기"}
              </motion.h2>

              <motion.form 
                className="space-y-6" 
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.0 }}
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                >
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    이름
                  </label>
                  <motion.input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white transition-all duration-200"
                    placeholder={settings.contact_form_name_placeholder || "홍길동"}
                    required
                    whileFocus={{ scale: 1.02 }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.4 }}
                >
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    이메일
                  </label>
                  <motion.input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white transition-all duration-200"
                    placeholder={settings.contact_form_email_placeholder || "hello@example.com"}
                    required
                    whileFocus={{ scale: 1.02 }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.6 }}
                >
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    제목
                  </label>
                  <motion.input
                    type="text"
                    id="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white transition-all duration-200"
                    placeholder={settings.contact_form_subject_placeholder || "문의 제목"}
                    whileFocus={{ scale: 1.02 }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.8 }}
                >
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    메시지
                  </label>
                  <motion.textarea
                    id="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white resize-y transition-all duration-200"
                    placeholder={settings.contact_form_message_placeholder || "여기에 메시지를 입력해주세요..."}
                    required
                    whileFocus={{ scale: 1.02 }}
                  ></motion.textarea>
                </motion.div>


                <motion.button
                  type="submit"
                  className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 2.0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? '전송 중...' : '메시지 전송'}
                </motion.button>
              </motion.form>
            </motion.div>
          )}
        </main>
      </div>
    </>
  );
}