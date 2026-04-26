"use client";

import * as React from "react";

export function usePagination(initial: { page?: number; pageSize?: number } = {}) {
  const [page, setPage] = React.useState(initial.page ?? 1);
  const [pageSize, setPageSize] = React.useState(initial.pageSize ?? 20);

  const reset = React.useCallback(() => setPage(1), []);

  return { page, pageSize, setPage, setPageSize, reset };
}

