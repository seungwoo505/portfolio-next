"use client";

import { useEffect, useRef, useState } from "react";
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
  const sourceRef = useRef({ value, legacyMarkdown });
  const readyRef = useRef(false);
  const lastDocumentRef = useRef("");
  const [initialization, setInitialization] = useState<"loading" | "ready" | "error">("loading");
  if (!initialContentRef.current) {
    initialContentRef.current = getInitialBlockContent(value, "");
  }

  const editor = useCreateBlockNote(
    {
      initialContent: initialContentRef.current,
      uploadFile: onImageUpload,
    },
    []
  );

  useEffect(() => {
    if (readyRef.current) return;
    try {
      const source = sourceRef.current;
      const blocks = getInitialBlockContent(
        source.value,
        source.legacyMarkdown,
        (markdown) => editor.tryParseMarkdownToBlocks(markdown)
      );
      // 가져오는 동안 발생한 onChange는 저장된 원문에 전파하지 않는다.
      editor.replaceBlocks(editor.document, blocks);
      lastDocumentRef.current = JSON.stringify(editor.document);
      readyRef.current = true;
      setInitialization("ready");
    } catch {
      setInitialization("error");
    }
  }, [editor]);

  const emitChange = () => {
    if (!readyRef.current) return;
    const blocks = editor.document as BlockContent;
    const serialized = JSON.stringify(blocks);
    if (serialized === lastDocumentRef.current) return;
    lastDocumentRef.current = serialized;
    onChange({
      blocks,
      markdown: editor.blocksToMarkdownLossy(blocks),
      html: editor.blocksToHTMLLossy(blocks),
      text: extractPlainTextFromBlocks(blocks),
    });
  };

  return (
    <div className="blog-block-editor overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800">
      {initialization === "error" && (
        <p role="alert" className="p-4 text-sm text-red-600 dark:text-red-400">
          기존 본문을 불러오지 못했습니다. 원문은 유지됩니다. 새로고침 후 다시 시도해주세요.
        </p>
      )}
      <BlockNoteView
        editor={editor}
        theme={isDarkMode ? "dark" : "light"}
        editable={initialization === "ready"}
        onChange={emitChange}
      />
    </div>
  );
}
