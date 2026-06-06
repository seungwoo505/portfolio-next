import Link from "next/link";
import { lazy, Suspense } from "react";
import { ChevronDown } from "lucide-react";
import type { GalaxyConfig, MousePosition } from "./homeTypes";

const Galaxy = lazy(() => import("../OptimizedGalaxy"));

interface HomeHeroSectionProps {
  displayName: string;
  displayDescription: string;
  titleWords: string[];
  mousePosition: MousePosition;
  galaxyProps: GalaxyConfig;
}

export default function HomeHeroSection({
  displayName,
  displayDescription,
  titleWords,
  mousePosition,
  galaxyProps,
}: HomeHeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-black overflow-hidden galaxy-section">
        <div className="w-full h-full relative galaxy-container">
          <Suspense fallback={<div className="w-full h-full bg-black" />}>
            <Galaxy key="galaxy-static" {...galaxyProps} />
          </Suspense>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/20 to-black/90 pointer-events-none"></div>
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent pointer-events-none" />
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`,
        }}
      />
      <div className="relative z-10 mx-auto max-w-6xl text-center animate-fade-in-up">
        <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100 shadow-2xl shadow-blue-500/10 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
          Galaxy Interface
        </div>
        <div className="mb-7 animate-fade-in-up">
          <h1 className="mx-auto max-w-5xl cursor-pointer text-5xl font-black leading-[0.95] tracking-normal transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] sm:text-6xl md:text-7xl lg:text-8xl xl:text-[6.5rem]">
            <span
              className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x"
              style={{
                backgroundSize: "200% 200%",
              }}
            >
              {displayName}
            </span>
          </h1>
          <div className="flex justify-center items-center space-x-4 mt-6">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-blue-500" />
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse-slow" />
            <div className="h-px w-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse-slow animation-delay-1000" />
          </div>
        </div>
        <div className="mb-10 animate-fade-in-up">
          <p className="text-xl font-light text-slate-200 sm:text-2xl md:text-3xl">
            {titleWords.map((word, index) => (
              <span
                key={word}
                className={`inline-block mx-2 animate-fade-in-up ${
                  index === 0
                    ? "animation-delay-500"
                    : index === 1
                      ? "animation-delay-700"
                      : "animation-delay-900"
                }`}
              >
                {word}
              </span>
            ))}
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg md:text-xl animate-fade-in-up animation-delay-1100">
            {displayDescription}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 animate-fade-in-up">
          <Link
            href="/projects"
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            프로젝트 보기
          </Link>
          <Link
            href="/contact"
            className="px-8 py-3 border-2 border-slate-300 text-slate-300 font-semibold rounded-lg hover:bg-slate-300 hover:text-slate-900 transition-all duration-300 contact-btn active:scale-95"
          >
            연락하기
          </Link>
        </div>
        <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3 animate-fade-in-up">
          {[
            ["Focus", "인터랙션과 콘텐츠가 함께 살아있는 화면"],
            ["Stack", "Next.js, TypeScript, 운영형 관리자 경험"],
            ["Mission", "빠르고 읽기 쉬운 웹 경험 설계"],
          ].map(([label, text]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                {label}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200">{text}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center mt-10 scroll-indicator animate-float">
          <button
            type="button"
            className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center cursor-pointer transition-transform duration-150 hover:scale-110"
            onClick={() => {
              document.querySelector("#latest-content")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
          >
            <div className="w-1 h-3 bg-slate-400 rounded-full mt-2 animate-pulse-slow" />
          </button>
          <ChevronDown className="w-4 h-4 text-slate-400 mx-auto mt-2" />
        </div>
        <div className="flex justify-center items-center space-x-6 mt-6 animate-fade-in-up">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse-slow animation-delay-500" />
          <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse-slow animation-delay-1000" />
          <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse-slow animation-delay-1500" />
        </div>
      </div>
    </section>
  );
}
