import type { Dispatch, SetStateAction } from "react";
import {
  SkillSkeletonContent,
  SkeletonSkill,
} from "./HomeStateViews";
import type { HomeSkill } from "./homeTypes";

interface HomeSkillsSectionProps {
  loading: boolean;
  activeSkillTab: string;
  setActiveSkillTab: Dispatch<SetStateAction<string>>;
  categorizedSkills: Record<string, HomeSkill[]>;
  currentSkills: HomeSkill[];
  fallbackSkills: string[];
  skillSkeletonCount: number;
  skillsRevealCount: number;
}

export default function HomeSkillsSection({
  loading,
  activeSkillTab,
  setActiveSkillTab,
  categorizedSkills,
  currentSkills,
  fallbackSkills,
  skillSkeletonCount,
  skillsRevealCount,
}: HomeSkillsSectionProps) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300">
          Tool Orbit
        </p>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          주요 기술 스택
        </h2>
      </div>
      <div className="flex justify-center mb-8">
        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 shadow-lg border border-slate-200 dark:border-slate-600">
          <button
            onClick={() => setActiveSkillTab("all")}
            className={`skill-tab-btn px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeSkillTab === "all"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md border border-slate-200 dark:border-slate-600"
                : "text-slate-600 dark:text-slate-400 bg-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-600"
            }`}
          >
            All
          </button>
          {Object.keys(categorizedSkills).map((category) => (
            <button
              key={category}
              onClick={() => setActiveSkillTab(category)}
              className={`skill-tab-btn px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeSkillTab === category
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md border border-slate-200 dark:border-slate-600"
                  : "text-slate-600 dark:text-slate-400 bg-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-600"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: skillSkeletonCount }).map((_, index) => (
            <SkeletonSkill key={`skill-loading-${index}`} />
          ))
        ) : currentSkills && currentSkills.length > 0 ? (
          currentSkills.map((skill, index) => {
            const isRevealed = index < skillsRevealCount;
            const baseClass =
              "p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-center transition-all duration-300";
            const stateClass = isRevealed
              ? "cursor-pointer transform hover:-translate-y-1 hover:scale-105"
              : "cursor-default pointer-events-none";

            return (
              <div key={skill.id} className={`${baseClass} ${stateClass}`}>
                {isRevealed ? (
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {skill.name}
                  </span>
                ) : (
                  <SkillSkeletonContent />
                )}
              </div>
            );
          })
        ) : (
          fallbackSkills.map((skill) => (
            <div
              key={skill}
              className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-center shadow-sm transition hover:-translate-y-1 dark:border-white/10 dark:bg-[rgba(15,23,42,0.55)]"
            >
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {skill}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
