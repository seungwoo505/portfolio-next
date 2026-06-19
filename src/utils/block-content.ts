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
  return extractPlainTextFromBlocks(blocks).trim().length > 0;
}

export function markdownToBasicBlocks(markdown: string): BlockContent {
  if (!markdown.trim()) {
    return emptyBlockContent;
  }

  return markdown
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const heading = chunk.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        return {
          type: "heading",
          props: {
            level: heading[1].length,
          },
          content: heading[2],
        };
      }

      return {
        type: "paragraph",
        content: chunk,
      };
    }) as BlockContent;
}

export function getInitialBlockContent(
  blockValue: unknown,
  legacyMarkdown: string
): BlockContent {
  const parsed = parseBlockContent(blockValue);
  if (hasMeaningfulBlockContent(parsed)) {
    return parsed;
  }

  return markdownToBasicBlocks(legacyMarkdown);
}

export function extractPlainTextFromBlocks(blocks: BlockContent): string {
  const parts: string[] = [];

  const visitContent = (content: unknown) => {
    if (typeof content === "string") {
      parts.push(content);
      return;
    }

    if (!Array.isArray(content)) {
      return;
    }

    content.forEach((item) => {
      if (typeof item === "string") {
        parts.push(item);
      } else if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        if (typeof record.text === "string") {
          parts.push(record.text);
        }
        visitContent(record.content);
      }
    });
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
