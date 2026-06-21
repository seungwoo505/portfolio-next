"use client";
import { useState, useEffect } from "react";
import { contactApi } from "@/lib/api";
import { ContactMessage, SiteSettings } from "@/types";
import ScrollProgress from "@/components/ScrollProgress";
import { api } from "@/lib/api";
import toast from 'react-hot-toast';

/**
 * @component ContactPage
 * @description SEO 메타데이터와 동적 설정, 문의 폼을 포함한 연락처 페이지입니다.
 * @returns {JSX.Element} 인터랙티브한 연락처 페이지 컴포넌트.
 */
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
    /**
     * @function fetchSettings
     * @description 연락처 페이지에 필요한 사이트 설정을 불러와 문구와 토글 값을 채웁니다.
     * @returns {Promise<void>} 설정 상태 갱신이 완료되면 해결됩니다.
     */
    const fetchSettings = async () => {
      try {
        const response = await api.get<{ data: SiteSettings }>('/settings');
        if (response.data?.data) {
          setSettings(response.data.data);
        }
      } catch {
      }
    };

    fetchSettings();
  }, []);

  /**
   * @function handleSubmit
   * @description 연락처 폼 데이터를 백엔드 API로 전송하고 사용자에게 피드백을 제공합니다.
   * @param {React.FormEvent} e 폼 제출 이벤트.
   * @returns {Promise<void>} 전송 작업이 완료되면 해결됩니다.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

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

  /**
   * @function handleChange
   * @description 입력 값이 바뀔 때 폼 상태를 갱신합니다.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e 폼 필드의 변경 이벤트.
   * @returns {void}
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  return (
    <>
      <ScrollProgress />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-fade-in-up">
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-8 text-center">
              연락처
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-12 text-center max-w-2xl mx-auto">
              {settings?.contact_description || '궁금한 점이 있으시거나 협업을 원하시면 언제든지 메시지를 보내주세요!'}
            </p>
          </div>

          {settings?.contact_enabled === false ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 text-center animate-fade-in-up">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                연락처 폼이 비활성화되었습니다
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                현재 연락처 폼을 통한 메시지 전송이 불가능합니다.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 animate-fade-in-up">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                {settings.contact_form_submit_text || "메시지 보내기"}
              </h2>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white transition duration-200 focus:scale-[1.01]"
                    placeholder={settings.contact_form_name_placeholder || "홍길동"}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white transition duration-200 focus:scale-[1.01]"
                    placeholder={settings.contact_form_email_placeholder || "hello@example.com"}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    제목
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white transition duration-200 focus:scale-[1.01]"
                    placeholder={settings.contact_form_subject_placeholder || "문의 제목"}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    메시지
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white resize-y transition duration-200 focus:scale-[1.01]"
                    placeholder={settings.contact_form_message_placeholder || "여기에 메시지를 입력해주세요..."}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '전송 중...' : '메시지 전송'}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
