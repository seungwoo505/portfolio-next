"use client";
import Link from "next/link";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminProvider, useAdmin } from '@/contexts/AdminContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
/**
 * @component AdminLoginContent
 * @description 관리자 인증을 위한 로그인 폼을 제공하는 페이지 컴포넌트.
 * @returns {JSX.Element} 관리자 로그인 페이지.
 */
function AdminLoginContent() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdmin();
  const router = useRouter();
  /**
   * @function handleSubmit
   * @description 로그인 폼 제출을 처리하고 성공 시 관리자 대시보드로 이동한다.
   * @param {React.FormEvent} e 폼 제출 이벤트.
   * @returns {Promise<void>} 로그인 작업.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    const formData = new FormData(e.currentTarget);
    const username = String(formData.get('username') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!username || !password) {
      return;
    }

    setCredentials({ username, password });
    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        toast.success('로그인에 성공했습니다!');
        router.push('/admin');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다.';
      toast.error(errorMessage);
      setCredentials({
        username: '',
        password: ''
      });
    } finally {
      setIsLoading(false);
    }
  };
  /**
   * @function handleFormKeyDown
   * @description 입력 필드에서 Enter 입력 시 브라우저 기본 제출을 명시적으로 실행한다.
   * @param {React.KeyboardEvent<HTMLFormElement>} e 폼 키보드 이벤트.
   * @returns {void}
   */
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) {
      return;
    }

    if (
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLButtonElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    e.preventDefault();
    e.currentTarget.requestSubmit();
  };
  /**
   * @function handleChange
   * @description 입력 필드 변경에 따라 자격 증명 상태를 갱신한다.
   * @param {React.ChangeEvent<HTMLInputElement>} e 입력 변경 이벤트.
   * @returns {void}
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-5 py-16 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="w-full max-w-md">
        <Link href="/" className="text-lg font-semibold tracking-tight">승우<span className="text-teal-700 dark:text-teal-400">.dev</span></Link>
        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-9 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-8"><p className="section-label">관리자</p><Heading className="mt-3">다시 오신 것을 환영합니다.</Heading><Text className="mt-3">계정으로 로그인해 콘텐츠를 관리하세요.</Text></div>
          <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-6" aria-busy={isLoading}>
            <div><label htmlFor="username" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">사용자명</label><div className="relative"><User className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-zinc-400" /><input type="text" id="username" name="username" value={credentials.username} onChange={handleChange} className="field-input pl-10" placeholder="사용자명을 입력하세요" required autoComplete="username" /></div></div>
            <div><label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">비밀번호</label><div className="relative"><Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-zinc-400" /><input type={showPassword ? 'text' : 'password'} id="password" name="password" value={credentials.password} onChange={handleChange} className="field-input pl-10 pr-12" placeholder="비밀번호를 입력하세요" required autoComplete="current-password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200" aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
            <Button type="submit" disabled={isLoading} color="teal" className="w-full">{isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /><span>로그인 중...</span></> : '로그인'}</Button>
          </form>
        </section>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4"><Link href="/" className="text-sm text-zinc-500 transition-colors hover:text-teal-700 dark:text-zinc-400 dark:hover:text-teal-400">← 메인 사이트로 돌아가기</Link><span className="text-xs text-zinc-400 dark:text-zinc-500">승인된 관리자 전용</span></div>
      </div>
    </main>
  );
}

export default function AdminLogin() {
  return <AdminProvider><AdminLoginContent /></AdminProvider>;
}
