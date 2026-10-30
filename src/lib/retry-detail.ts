"use server";

import { revalidatePath } from "next/cache";

export async function retryDetail(pathname: string): Promise<void> {
  const match = typeof pathname === "string" && pathname.length <= 1024
    ? /^\/(?:projects|blog)\/([^/?#]+)$/.exec(pathname)
    : null;
  let slug = "";
  try {
    slug = match ? decodeURIComponent(match[1]) : "";
  } catch {
    // 잘못 인코딩된 경로는 캐시 무효화 대상으로 사용하지 않는다.
  }
  if (!slug || slug === "." || slug === ".." || /[\\/?#\[\]\u0000-\u001f\u007f]/.test(slug)) {
    throw new Error("상세 페이지 경로가 올바르지 않습니다.");
  }

  revalidatePath(pathname);
}
