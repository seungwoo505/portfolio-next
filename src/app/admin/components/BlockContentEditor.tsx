"use client";

import { useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { BlockEditorValue } from "@/utils/block-content";
import {
  extractPlainTextFromBlocks,
  getInitialBlockContent,
  type BlockContent,
} from "@/utils/block-content";

interface BlockContentEditorProps {
  value: unknown;
  legacyMarkdown: string;
  isDarkMode: boolean;
  onChange: (value: BlockEditorValue) => void;
  onImageUpload: (file: File) => Promise<string>;
}

export default function BlockContentEditor({
  value,
  legacyMarkdown,
  isDarkMode,
  onChange,
  onImageUpload,
}: BlockContentEditorProps) {
  const initialContentRef = useRef<BlockContent | null>(null);
  if (!initialContentRef.current) {
    initialContentRef.current = getInitialBlockContent(value, legacyMarkdown);
  }

  const editor = useCreateBlockNote(
    {
      initialContent: initialContentRef.current,
      uploadFile: onImageUpload,
    },
    []
  );

  const emitChange = () => {
    const blocks = editor.document as BlockContent;
    onChange({
      blocks,
      markdown: editor.blocksToMarkdownLossy(blocks),
      html: editor.blocksToHTMLLossy(blocks),
      text: extractPlainTextFromBlocks(blocks),
    });
  };

  return (
    <div className="blog-block-editor rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
      <BlockNoteView
        editor={editor}
        theme={isDarkMode ? "dark" : "light"}
        onChange={emitChange}
      />
    </div>
  );
}
