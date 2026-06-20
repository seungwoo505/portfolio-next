import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { normalizeImageUrl } from './image-url';

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
  });
};

export function convertGitHubImageUrls(text: string): string {
  return text.replace(
    /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/([^"'\s)]+)/g,
    (url) => normalizeImageUrl(url)
  );
}
export function convertGitHubImageUrlsInHtml(html: string): string {
  return html.replace(
    /<img([^>]*?)src="(https:\/\/github\.com\/[^"]*?\/blob\/[^"]*?)"([^>]*?)>/g,
    (match, before, src, after) => {
      const convertedSrc = convertGitHubImageUrls(src);
      return `<img${before}src="${convertedSrc}"${after}>`;
    }
  );
}
export function markdownToHtml(text: string): string {
  if (!text) return '';
  const convertedText = convertGitHubImageUrls(text);
  marked.setOptions({
    breaks: true,        // 줄바꿈을 <br>로 변환
    gfm: true,           // GitHub Flavored Markdown 지원
    renderer: new marked.Renderer()
  });
  const renderer = new marked.Renderer();
  renderer.link = function(link: { href: string; title?: string | null; tokens: Array<{ raw?: string; text?: string }> }): string {
    const { href, title, tokens } = link;
    const text = tokens.map((token) => token.raw || token.text || '').join('');
    const isExternal = href.startsWith('http') && !href.includes('seungwoo.i234.me');
    const titleAttr = title ? ` title="${title}"` : '';
    const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    const iconClass = isExternal ? ' external-link' : '';
    return `<a href="${href}" class="markdown-link${iconClass}"${titleAttr}${targetAttr}>${text}</a>`;
  };
  renderer.code = function({ text, lang }: { text: string; lang?: string }): string {
    const languageClass = lang ? `language-${lang}` : '';
    return `<pre class="markdown-code-block"><code class="${languageClass}">${text}</code></pre>`;
  };
  renderer.codespan = function({ text }: { text: string }): string {
    return `<code class="markdown-inline-code">${text}</code>`;
  };
  marked.setOptions({
    breaks: true,
    gfm: true,
    renderer: renderer
  });
  return sanitizeHtml(marked.parse(convertedText) as string);
}
export function markdownToHtmlInline(text: string): string {
  if (!text) return '';
  const convertedText = convertGitHubImageUrls(text);
  marked.setOptions({
    breaks: true,        // 줄바꿈을 <br>로 변환
    gfm: true            // GitHub Flavored Markdown 지원
  });
  return sanitizeHtml(marked.parseInline(convertedText) as string);
}
