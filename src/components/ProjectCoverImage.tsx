"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { normalizeImageUrl } from "@/utils/image-url";

interface ProjectCoverImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  fallbackLabel?: string;
  transitionKey?: string;
  transitionRole?: 'list' | 'detail';
}

export default function ProjectCoverImage({
  src,
  alt,
  className = "",
  imageClassName = "object-cover",
  sizes = "100vw",
  priority = false,
  fallbackLabel,
  transitionKey,
  transitionRole = 'list',
}: ProjectCoverImageProps) {
  const normalizedSrc = useMemo(() => normalizeImageUrl(src), [src]);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const shouldShowImage = normalizedSrc && failedSrc !== normalizedSrc;
  const fallbackText = fallbackLabel ?? alt;

  useEffect(() => {
    setFailedSrc(null);
  }, [normalizedSrc]);

  return (
    <div data-project-image={transitionKey} data-project-image-role={transitionKey ? transitionRole : undefined} className={`relative overflow-hidden bg-zinc-100 dark:bg-zinc-950 ${className}`}>
      {shouldShowImage ? (
        <Image
          src={normalizedSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized
          className={imageClassName}
          onError={() => setFailedSrc(normalizedSrc)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-zinc-50 p-8 text-center dark:bg-zinc-900">
          <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-2xl border border-zinc-200 font-mono text-xl text-teal-700 dark:border-zinc-700 dark:text-teal-300">&lt;/&gt;</span>
          <span className="line-clamp-2 text-base font-semibold tracking-tight text-zinc-600 dark:text-zinc-300">
            {fallbackText || "대표 이미지 없음"}
          </span>
        </div>
      )}
    </div>
  );
}
