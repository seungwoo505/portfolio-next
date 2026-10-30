import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/site/Container";
import { EmptyState, SkeletonSkill } from "./HomeStateViews";
import type { HomeSkill } from "./homeTypes";

interface HomeSkillsSectionProps {
  loading: boolean;
  activeSkillTab: string;
  setActiveSkillTab: Dispatch<SetStateAction<string>>;
  categorizedSkills: Record<string, HomeSkill[]>;
  currentSkills: HomeSkill[];
}

export default function HomeSkillsSection({ loading, activeSkillTab, setActiveSkillTab, categorizedSkills, currentSkills }: HomeSkillsSectionProps) {
  return <Container className="border-t border-zinc-200 py-16 sm:py-20 dark:border-zinc-800">
    <div className="grid gap-9 lg:grid-cols-[0.8fr_1.4fr] lg:gap-20">
      <div data-reveal><p className="section-label">기술과 경험</p><h2 className="mt-4 text-3xl font-bold leading-snug tracking-tight">아이디어를 구현하는<br />도구들</h2><p className="muted-text mt-5 max-w-sm text-sm leading-7">프로젝트에 사용한 기술과 경험을 소개합니다. 자세한 활용 과정은 각 프로젝트에서 확인할 수 있습니다.</p><Link href="/about" prefetch={false} className="text-link mt-6">경험 더 알아보기<ArrowUpRight size={15} aria-hidden="true" /></Link></div>
      <div className="min-w-0">
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="기술 분류">
          {['all', ...Object.keys(categorizedSkills)].map(category => <button key={category} type="button" className="filter-chip" aria-pressed={activeSkillTab === category} onClick={() => setActiveSkillTab(category)}>{category === 'all' ? '전체' : category}</button>)}
        </div>
        {loading ? <div className="grid grid-cols-2 gap-3"><SkeletonSkill /><SkeletonSkill /></div> : currentSkills.length ? <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">{currentSkills.map(skill => <li key={skill.id} className="flex min-h-18 items-center gap-3 rounded-xl border border-zinc-200 px-4 py-5 dark:border-zinc-800"><span className="size-1.5 shrink-0 rounded-full bg-teal-600 dark:bg-teal-400" aria-hidden="true" /><span className="text-sm font-medium">{skill.name}</span></li>)}</ul> : <EmptyState eyebrow="기술" title="기술 정보를 준비하고 있습니다" description="등록된 기술과 경험을 이곳에서 확인할 수 있습니다." />}
      </div>
    </div>
  </Container>;
}
