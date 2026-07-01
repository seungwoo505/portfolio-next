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
        <p className="mb-3 text-xs font-bold uppercase tracking-normal text-blue-700 dark:text-blue-300">
          Tech Counter
        </p>
        <h2 className="text-3xl font-black text-slate-950 dark:text-white">
          기술 스택 매대
        </h2>
      </div>
      <div className="flex justify-center mb-8">
        <div className="flex space-x-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/10">
          <button
            onClick={() => setActiveSkillTab("all")}
            className={`skill-tab-btn rounded-md px-4 py-2 text-sm font-bold transition-all duration-200 ${
              activeSkillTab === "all"
                ? "border border-slate-950 bg-slate-950 text-white shadow-md dark:border-emerald-300 dark:bg-emerald-300 dark:text-slate-950"
                : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            }`}
          >
            All
          </button>
          {Object.keys(categorizedSkills).map((category) => (
            <button
              key={category}
              onClick={() => setActiveSkillTab(category)}
              className={`skill-tab-btn rounded-md px-4 py-2 text-sm font-bold transition-all duration-200 ${
                activeSkillTab === category
                  ? "border border-slate-950 bg-slate-950 text-white shadow-md dark:border-emerald-300 dark:bg-emerald-300 dark:text-slate-950"
                  : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
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
              "rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm transition-all duration-300 dark:border-white/10 dark:bg-white/10";
            const stateClass = isRevealed
              ? "cursor-pointer transform hover:-translate-y-1 hover:scale-105"
              : "cursor-default pointer-events-none";

            return (
              <div key={skill.id} className={`${baseClass} ${stateClass}`}>
                {isRevealed ? (
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
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
              className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 dark:border-white/10 dark:bg-white/10"
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
