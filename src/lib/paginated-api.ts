import type { ApiResponse } from "@/types";

type PaginationParams = {
  page: number;
  limit: number;
};

type FetchPage<T> = (params: PaginationParams) => Promise<ApiResponse<T[]>>;

type FetchAllPagesOptions = {
  pageSize: number;
  maxPages?: number;
};

export async function fetchAllPages<T>(
  fetchPage: FetchPage<T>,
  { pageSize, maxPages = 500 }: FetchAllPagesOptions
): Promise<ApiResponse<T[]>> {
  const items: T[] = [];
  let page = 1;
  let total = 0;
  let totalPages = 1;

  while (page <= totalPages && page <= maxPages) {
    const response = await fetchPage({ page, limit: pageSize });

    if (!response.success) {
      return {
        ...response,
        data: items.length > 0 ? items : response.data ?? [],
      };
    }

    const pageItems = Array.isArray(response.data) ? response.data : [];
    items.push(...pageItems);

    total = response.pagination?.total ?? items.length;
    totalPages = response.pagination?.totalPages ?? page;
    page += 1;
  }

  if (page <= totalPages) {
    return {
      success: false,
      data: items,
      message: "페이지 수가 너무 많아 전체 목록을 불러오지 못했습니다.",
      pagination: {
        page: page - 1,
        limit: pageSize,
        total,
        totalPages,
      },
    };
  }

  return {
    success: true,
    data: items,
    pagination: {
      page: 1,
      limit: pageSize,
      total,
      totalPages,
    },
  };
}
