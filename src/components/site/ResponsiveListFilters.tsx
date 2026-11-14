'use client';
import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import './responsive-list-filters.css';

interface Props { id: string; selectedCount: number; sortLabel: string; hasSearch?: boolean; children: ReactNode; }
export default function ResponsiveListFilters({ id, selectedCount, sortLabel, hasSearch = true, children }: Props) {
  const [open, setOpen] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const [search, sort, filters] = Children.toArray(children);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const update = () => setDesktop(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return <div className="list-filter-grid" data-has-search={hasSearch}>
    <div className="list-filter-search">{search}</div>
    <div className="list-filter-mobile-summary">
      <button ref={toggle} type="button" data-list-filter-toggle aria-expanded={open} aria-controls={id}
        aria-label={`${open ? '필터 닫기' : '필터 열기'}${selectedCount ? ` (선택 ${selectedCount}개)` : ''}`}
        className="filter-chip" onClick={() => setOpen(value => !value)}>
        필터{selectedCount > 0 && <span className="font-semibold text-teal-700 dark:text-teal-300">{selectedCount}개</span>}
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="list-filter-chevron" data-open={open}><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <p className="muted-text text-xs" aria-live="polite">{sortLabel}{selectedCount > 0 ? ` · ${selectedCount}개 선택` : ' · 전체'}</p>
    </div>
    <div id={id} data-list-filter-panel data-open={open} className="list-filter-panel" inert={!open && !desktop}
      onKeyDown={event => {
        if (event.key !== 'Escape' || desktop || !open) return;
        event.preventDefault(); event.stopPropagation(); setOpen(false); toggle.current?.focus();
      }}>
      <div className="list-filter-body"><div className="list-filter-sort">{sort}</div><div className="list-filter-tags">{filters}</div></div>
    </div>
  </div>;
}
