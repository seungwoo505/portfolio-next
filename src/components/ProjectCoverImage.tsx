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
}

export default function ProjectCoverImage({
  src,
  alt,
  className = "",
  imageClassName = "object-cover",
  sizes = "100vw",
  priority = false,
  fallbackLabel,
}: ProjectCoverImageProps) {
  const normalizedSrc = useMemo(() => normalizeImageUrl(src), [src]);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const shouldShowImage = normalizedSrc && failedSrc !== normalizedSrc;
  const fallbackText = fallbackLabel ?? alt;

  useEffect(() => {
    setFailedSrc(null);
  }, [normalizedSrc]);

  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-900 ${className}`}>
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
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-blue-100 p-4 text-center dark:from-slate-800 dark:via-slate-900 dark:to-blue-950">
          <span className="line-clamp-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {fallbackText || "대표 이미지 없음"}
          </span>
        </div>
      )}
    </div>
  );
}
