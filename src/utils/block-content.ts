import type { PartialBlock } from "@blocknote/core";

export type BlockContent = PartialBlock[];

export type BlockEditorValue = {
  blocks: BlockContent;
  markdown: string;
  html: string;
  text: string;
};

export const emptyBlockContent: BlockContent = [
  {
    type: "paragraph",
    content: "",
  },
];

export function parseBlockContent(value: unknown): BlockContent {
  if (Array.isArray(value)) {
    return value as BlockContent;
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed as BlockContent;
      }
    } catch {
      return emptyBlockContent;
    }
  }

  return emptyBlockContent;
}

export function hasMeaningfulBlockContent(blocks: BlockContent): boolean {
  if (extractPlainTextFromBlocks(blocks).trim()) return true;

  return blocks.some((block) => {
    if (!block || typeof block !== "object") return false;
    const record = block as Record<string, unknown>;
    if (record.type === "divider") return true;
    if (record.type === "table" && record.content) return true;
    if (["image", "video", "audio", "file"].includes(String(record.type))) {
      const props = record.props as Record<string, unknown> | undefined;
      if (typeof props?.url === "string" && props.url.trim()) return true;
    }
    return Array.isArray(record.children) && hasMeaningfulBlockContent(record.children);
  });
}

export function getInitialBlockContent(
  blockValue: unknown,
  legacyMarkdown: string,
  parseMarkdown?: (markdown: string) => BlockContent
): BlockContent {
  const parsed = parseBlockContent(blockValue);
  if (hasMeaningfulBlockContent(parsed)) {
    return parsed;
  }

  if (!legacyMarkdown.trim()) return emptyBlockContent;
  if (!parseMarkdown) throw new Error("Markdown을 가져올 편집기 파서가 필요합니다.");
  const imported = parseMarkdown(legacyMarkdown);
  if (!hasMeaningfulBlockContent(imported)) {
    throw new Error("기존 본문을 빈 문서로 가져올 수 없습니다.");
  }
  return imported;
}

export function extractPlainTextFromBlocks(blocks: BlockContent): string {
  const parts: string[] = [];

  const visitContent = (content: unknown) => {
    if (typeof content === "string") {
      parts.push(content);
      return;
    }

    if (content && typeof content === "object" && !Array.isArray(content)) {
      const record = content as Record<string, unknown>;
      if (typeof record.text === "string") parts.push(record.text);
      visitContent(record.content);
      visitContent(record.rows);
      visitContent(record.cells);
      return;
    }
    if (Array.isArray(content)) content.forEach(visitContent);
  };

  const visitBlock = (block: unknown) => {
    if (!block || typeof block !== "object") {
      return;
    }

    const record = block as Record<string, unknown>;
    visitContent(record.content);

    const props = record.props;
    if (props && typeof props === "object") {
      const { caption, name } = props as Record<string, unknown>;
      if (typeof caption === "string" && caption.trim()) {
        parts.push(caption);
      }
      if (typeof name === "string" && name.trim()) {
        parts.push(name);
      }
    }

    if (Array.isArray(record.children)) {
      record.children.forEach(visitBlock);
    }
  };

  blocks.forEach(visitBlock);

  return parts.join(" ").replace(/\s+/g, " ").trim();
}
