"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";

export function useApiQuery<T>(
  queryKey: unknown[],
  path: string,
  opts: Omit<UseQueryOptions<T>, "queryKey" | "queryFn"> = {},
) {
  return useQuery({
    queryKey,
    queryFn: () => apiFetch<T>(path),
    ...opts,
  });
}

