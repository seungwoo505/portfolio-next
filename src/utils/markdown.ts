import { marked } from 'marked';

/**
 * GitHub 이미지 URL을 raw URL로 변환하는 함수
 */
export function convertGitHubImageUrls(text: string): string {
  return text.replace(
    /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/([^"'\s)]+)/g,
    'https://raw.githubusercontent.com/$1/$2/$3/$4'
  );
}

/**
 * HTML 문자열에서 GitHub 이미지 URL을 변환하는 함수 (MDEditor용)
 */
export function convertGitHubImageUrlsInHtml(html: string): string {
  return html.replace(
    /<img([^>]*?)src="(https:\/\/github\.com\/[^"]*?\/blob\/[^"]*?)"([^>]*?)>/g,
    (match, before, src, after) => {
      const convertedSrc = convertGitHubImageUrls(src);
      return `<img${before}src="${convertedSrc}"${after}>`;
    }
  );
}

/**
 * 마크다운을 HTML로 변환하는 함수
 */
export function markdownToHtml(text: string): string {
  if (!text) return '';
  
  // GitHub 이미지 URL 변환
  const convertedText = convertGitHubImageUrls(text);
  
  // marked 옵션 설정
  marked.setOptions({
    breaks: true,        // 줄바꿈을 <br>로 변환
    gfm: true,           // GitHub Flavored Markdown 지원
    renderer: new marked.Renderer()
  });
  
  // 커스텀 렌더러 설정
  const renderer = new marked.Renderer();
  
  // 링크 렌더링 커스터마이징
  renderer.link = function(link: { href: string; title?: string | null; tokens: Array<{ raw?: string; text?: string }> }): string {
    const { href, title, tokens } = link;
    const text = tokens.map((token) => token.raw || token.text || '').join('');
    const isExternal = href.startsWith('http') && !href.includes('seungwoo.i234.me');
    const titleAttr = title ? ` title="${title}"` : '';
    const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    const iconClass = isExternal ? ' external-link' : '';
    
    return `<a href="${href}" class="markdown-link${iconClass}"${titleAttr}${targetAttr}>${text}</a>`;
  };
  
  // 코드 블록 렌더링 개선
  renderer.code = function({ text, lang }: { text: string; lang?: string }): string {
    const languageClass = lang ? `language-${lang}` : '';
    return `<pre class="markdown-code-block"><code class="${languageClass}">${text}</code></pre>`;
  };
  
  // 인라인 코드 렌더링 개선
  renderer.codespan = function({ text }: { text: string }): string {
    return `<code class="markdown-inline-code">${text}</code>`;
  };
  
  marked.setOptions({
    breaks: true,
    gfm: true,
    renderer: renderer
  });
  
  return marked.parse(convertedText) as string;
}

/**
 * 인라인 마크다운을 HTML로 변환하는 함수
 */
export function markdownToHtmlInline(text: string): string {
  if (!text) return '';
  
  // GitHub 이미지 URL 변환
  const convertedText = convertGitHubImageUrls(text);
  
  // marked 옵션 설정
  marked.setOptions({
    breaks: true,        // 줄바꿈을 <br>로 변환
    gfm: true            // GitHub Flavored Markdown 지원
  });
  
  return marked.parseInline(convertedText) as string;
}
