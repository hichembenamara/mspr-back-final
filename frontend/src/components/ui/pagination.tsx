"use client";

import * as React from "react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import type { PaginatedMeta } from "@/types/api";

export function Pagination({
  className,
  meta,
  onPageChange,
}: {
  className?: string;
  meta: PaginatedMeta;
  onPageChange: (page: number) => void;
}) {
  const canPrev = meta.page > 1;
  const canNext = meta.page < meta.total_pages;

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="text-xs text-zinc-600">
        Page <span className="font-medium text-zinc-900">{meta.page}</span> /{" "}
        <span className="font-medium text-zinc-900">{meta.total_pages}</span> • {meta.total} items
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={!canPrev} onClick={() => onPageChange(1)}>
          «
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Précédent
        </Button>
        <Button variant="secondary" size="sm" disabled={!canNext} onClick={() => onPageChange(meta.page + 1)}>
          Suivant
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageChange(meta.total_pages)}
        >
          »
        </Button>
      </div>
    </div>
  );
}

export function PageSizeSelect({
  value,
  onChange,
  options = [10, 20, 50, 100],
}: {
  value: number;
  onChange: (pageSize: number) => void;
  options?: number[];
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-zinc-600">
      Page size
      <select
        className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}

