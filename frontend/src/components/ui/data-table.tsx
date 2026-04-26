"use client";

import * as React from "react";

import { Alert } from "@/components/ui/alert";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cn } from "@/lib/cn";

export type ColumnDef<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

export function DataTable<T>({
  className,
  columns,
  rows,
  emptyLabel = "Aucune donnée.",
}: {
  className?: string;
  columns: ColumnDef<T>[];
  rows: T[];
  emptyLabel?: string;
}) {
  if (!rows.length) return <Alert className={className}>{emptyLabel}</Alert>;

  return (
    <div className={cn("overflow-x-auto rounded-lg border border-zinc-200", className)}>
      <Table>
        <THead>
          <TR>
            {columns.map((c) => (
              <TH key={c.key} className={c.className}>
                {c.header}
              </TH>
            ))}
          </TR>
        </THead>
        <TBody>
          {rows.map((row, idx) => (
            <TR key={idx}>
              {columns.map((c) => (
                <TD key={c.key} className={c.className}>
                  {c.cell(row)}
                </TD>
              ))}
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

