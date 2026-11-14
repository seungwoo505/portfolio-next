"use client";
import { useState, useEffect, useRef } from "react";
import { contactApi } from "@/lib/api";
import { ContactMessage, SiteSettings } from "@/types";
import ScrollProgress from "@/components/ScrollProgress";
import { api } from "@/lib/api";
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import './contact-feedback.css';

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
  const [submitState, setSubmitState] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const submitting = useRef(false);
  const draftRevision = useRef(0);
  const isSubmitting = submitState === 'pending';
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});

  useEffect(() => {
    /**
     * @function fetchSettings
     * @description 연락처 페이지에 필요한 사이트 설정을 불러와 문구와 토글 값을 채웁니다.
     * @returns {Promise<void>} 설정 상태 갱신이 완료되면 해결됩니다.
     */
    const fetchSettings = async () => {
      try {
        const response = await api.get<SiteSettings>('/settings');
        if (response.data) {
          setSettings(response.data);
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
    if (submitting.current || settings.contact_enabled === false) return;

    const submittedRevision = draftRevision.current;
    submitting.current = true;
    setSubmitState('pending');
    try {
      const response = await contactApi.sendMessage(formData);
      if (response.success) {
        const hasNewDraft = draftRevision.current !== submittedRevision;
        setSubmitState(hasNewDraft ? 'idle' : 'success');
        toast.success(response.message || '메시지가 성공적으로 전송되었습니다!');
        if (!hasNewDraft) setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setSubmitState('error');
        toast.error(response.message || '전송 중 오류가 발생했습니다.');
      }
    } catch {
      setSubmitState('error');
      const err = { message: '네트워크 오류가 발생했습니다.' };
      toast.error(err?.message || '네트워크 오류가 발생했습니다.');
    } finally {
      submitting.current = false;
    }
  };

  /**
   * @function handleChange
   * @description 입력 값이 바뀔 때 폼 상태를 갱신합니다.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e 폼 필드의 변경 이벤트.
   * @returns {void}
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    draftRevision.current += 1;
    if (!submitting.current) setSubmitState('idle');
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  return (
    <>
      <ScrollProgress />
      <div className="site-container site-section">
        <header className="max-w-2xl">
          <p className="section-label">연락처</p>
          <h1 className="page-heading mt-5">함께 만들고 싶은 일이 있나요?</h1>
          <p className="page-intro mt-6">{settings?.contact_description || '궁금한 점이나 협업하고 싶은 일이 있다면 메시지를 남겨주세요.'}</p>
        </header>
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-14">
          {settings?.contact_enabled === false ? <section className="surface-card p-6 sm:p-8" role="status"><h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">연락처 폼이 비활성화되었습니다</h2><p className="mt-4 leading-7 muted-text">현재 연락처 폼을 통한 메시지 전송이 불가능합니다.</p></section> : <section className="surface-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{settings.contact_form_submit_text || '메시지 보내기'}</h2>
            <form className="mt-7 space-y-6" onSubmit={handleSubmit} aria-busy={isSubmitting}>
              <div className="grid gap-6 sm:grid-cols-2">
                <div><label htmlFor="name" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">이름 <span className="text-teal-700 dark:text-teal-400" aria-hidden="true">*</span></label><input type="text" id="name" value={formData.name} onChange={handleChange} className="field-input" placeholder={settings.contact_form_name_placeholder || '홍길동'} required /></div>
                <div><label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">이메일 <span className="text-teal-700 dark:text-teal-400" aria-hidden="true">*</span></label><input type="email" id="email" value={formData.email} onChange={handleChange} className="field-input" placeholder={settings.contact_form_email_placeholder || 'hello@example.com'} required /></div>
              </div>
              <div><label htmlFor="subject" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">제목 <span className="ml-1 font-normal muted-text">선택</span></label><input type="text" id="subject" value={formData.subject} onChange={handleChange} className="field-input" placeholder={settings.contact_form_subject_placeholder || '문의 제목'} /></div>
              <div><label htmlFor="message" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">메시지 <span className="text-teal-700 dark:text-teal-400" aria-hidden="true">*</span></label><textarea id="message" value={formData.message} onChange={handleChange} rows={7} className="field-input resize-y" placeholder={settings.contact_form_message_placeholder || '어떤 이야기를 나누고 싶으신가요?'} required /></div>
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800"><p className="text-xs muted-text">* 표시는 필수 항목입니다.</p><Button type="submit" color="teal" disabled={isSubmitting} className="contact-submit" data-submit-state={submitState}>
                <span key={submitState} className="contact-submit-feedback">
                  {submitState === 'pending' && <span className="contact-submit-spinner" aria-hidden="true" />}
                  {submitState === 'success' && <svg data-submit-check viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  {submitState === 'error' && <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M10 6v5m0 3v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>}
                  {submitState === 'pending' ? '전송 중...' : submitState === 'success' ? '전송 완료' : submitState === 'error' ? '다시 전송' : '메시지 전송'}
                </span>
              </Button></div>
            </form>
          </section>}
          <aside className="py-2"><p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">좋은 대화의 시작</p><p className="mt-4 text-sm leading-7 muted-text">프로젝트의 목표와 함께 고민하고 싶은 내용을 알려주세요. 남겨주신 이메일로 이야기를 이어갈 수 있습니다.</p><div className="mt-8 h-px w-10 bg-teal-600 dark:bg-teal-400" aria-hidden="true" /></aside>
        </div>
      </div>
    </>
  );
}
