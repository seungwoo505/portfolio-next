export interface ArticleContentsItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface AttributeChange {
  element: HTMLElement;
  name: string;
  previous: string | null;
  assigned: string;
}

const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();

function headingId(text: string) {
  const slug = text.normalize('NFKC').toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-|-$/g, '');
  return `section-${slug || 'heading'}`;
}

/** 이미 정화되어 렌더된 본문만 읽고 목차가 필요한 경우 앵커 속성을 준비한다. */
export function prepareArticleContents(content: HTMLElement): {
  items: ArticleContentsItem[];
  cleanup: () => void;
} {
  const empty = { items: [], cleanup: () => {} };
  if (normalizeText(content.textContent || '').length < 1200) return empty;

  const headings = Array.from(content.querySelectorAll<HTMLElement>('h2, h3'))
    .filter(element => !element.closest('[hidden], [aria-hidden="true"]'))
    .map(element => ({ element, text: normalizeText(element.textContent || '') }))
    .filter(heading => heading.text.length > 0);
  if (headings.length < 3) return empty;

  const targets = new Set(headings.map(heading => heading.element));
  const reserved = new Set<string>();
  const outsideIds = new Set<string>();
  // 긴 본문에서 한 번만 확인해 뒤쪽 요소의 ID와 기존 앵커도 함께 보존한다.
  for (const element of content.ownerDocument.querySelectorAll<HTMLElement>('[id]')) {
    const id = element.id;
    if (!id) continue;
    reserved.add(id);
    if (!targets.has(element)) outsideIds.add(id);
  }

  const claimed = new Set<string>();
  const changes: AttributeChange[] = [];
  const assign = (element: HTMLElement, name: string, assigned: string) => {
    const previous = element.getAttribute(name);
    if (previous === assigned) return;
    changes.push({ element, name, previous, assigned });
    element.setAttribute(name, assigned);
  };
  const items = headings.map(({ element, text }): ArticleContentsItem => {
    const originalId = element.id;
    let id = originalId;
    if (!id || outsideIds.has(id) || claimed.has(id)) {
      const base = originalId || headingId(text);
      id = base;
      let suffix = 2;
      while (reserved.has(id) || claimed.has(id)) id = `${base}-${suffix++}`;
    }
    claimed.add(id);
    reserved.add(id);
    assign(element, 'id', id);
    if (!element.hasAttribute('tabindex')) assign(element, 'tabindex', '-1');
    return { id, text, level: element.tagName === 'H3' ? 3 : 2 };
  });

  return {
    items,
    cleanup() {
      for (const { element, name, previous, assigned } of changes) {
        if (element.getAttribute(name) !== assigned) continue;
        if (previous === null) element.removeAttribute(name);
        else element.setAttribute(name, previous);
      }
    },
  };
}
