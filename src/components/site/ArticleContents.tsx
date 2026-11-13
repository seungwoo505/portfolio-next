"use client";

import { useEffect, useState, type RefObject } from "react";
import { prepareArticleContents, type ArticleContentsItem } from "@/lib/article-contents";
import "./article-contents.css";

interface ArticleContentsProps {
  contentRef: RefObject<HTMLElement | null>;
  contentKey: string;
}

interface ContentsState {
  contentKey: string;
  items: ArticleContentsItem[];
  expanded: boolean;
}

export default function ArticleContents({ contentRef, contentKey }: ArticleContentsProps) {
  const [contents, setContents] = useState<ContentsState | null>(null);
  const readyKey = contents?.contentKey;
  const items = contents?.items;

  useEffect(() => {
    const content = contentRef.current;
    if (!content) {
      setContents(null);
      return;
    }
    const prepared = prepareArticleContents(content);
    setContents({
      contentKey,
      items: prepared.items,
      expanded: prepared.items.length > 0 && typeof window !== 'undefined'
        && window.matchMedia('(min-width: 768px)').matches,
    });
    return prepared.cleanup;
  }, [contentRef, contentKey]);

  useEffect(() => {
    if (readyKey !== contentKey || !items?.length || typeof window === 'undefined') return;
    const hash = window.location?.hash;
    if (!hash) return;
    let id: string;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      return;
    }
    if (!items.some(item => item.id === id)) return;
    const content = contentRef.current;
    const target = content?.ownerDocument.getElementById(id);
    if (!content || !target || !content.contains(target)) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || content.ownerDocument.documentElement.classList.contains('reduced-motion');
    // 동적 본문과 목차가 모두 표시된 뒤 직접 진입한 fragment만 복원한다.
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start', behavior: reduced ? 'instant' : 'auto' });
  }, [contentKey, contentRef, readyKey, items]);

  if (!contents || contents.contentKey !== contentKey || contents.items.length === 0) return null;

  return (
    <details
      className="article-contents"
      data-article-contents
      open={contents.expanded}
      onToggle={event => {
        const expanded = event.currentTarget.open;
        setContents(previous => previous?.contentKey === contentKey && previous.expanded !== expanded
          ? { ...previous, expanded } : previous);
      }}
    >
      <summary className="article-contents-toggle" data-article-contents-toggle>
        <span>목차 <span className="article-contents-count">{contents.items.length}개 항목</span></span>
        <svg className="article-contents-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
      </summary>
      <nav aria-label="이 글의 목차" className="article-contents-navigation">
        <ol>
          {contents.items.map(item => (
            <li key={item.id} className={item.level === 3 ? 'article-contents-subsection' : undefined}>
              <a href={`#${encodeURIComponent(item.id)}`}>{item.text}</a>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}
