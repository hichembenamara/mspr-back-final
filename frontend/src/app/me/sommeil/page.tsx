"use client";

import * as React from "react";

import { AppShell } from "@/components/layout/AppShell";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { PageSizeSelect, Pagination } from "@/components/ui/pagination";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { useApiQuery } from "@/hooks/useApiQuery";
import { usePagination } from "@/hooks/usePagination";
import type { Paginated } from "@/types/api";

type Row = Record<string, unknown>;

export default function SommeilPage() {
  const pager = usePagination({ page: 1, pageSize: 20 });
  const q = useApiQuery<Paginated<Row>>(
    ["me-sommeil", pager.page, pager.pageSize],
    `/api/me/sommeil-sante?page=${pager.page}&page_size=${pager.pageSize}`,
  );

  const columns = React.useMemo<ColumnDef<Row>[]>(
    () => [
      { key: "mesure_sommeil_id", header: "ID", cell: (r) => String(r["mesure_sommeil_id"] ?? "—") },
      { key: "mesure_le", header: "Date", cell: (r) => String(r["mesure_le"] ?? "—") },
      { key: "duree_sommeil_h", header: "Durée (h)", cell: (r) => String(r["duree_sommeil_h"] ?? "—") },
      { key: "qualite_sommeil", header: "Qualité", cell: (r) => String(r["qualite_sommeil"] ?? "—") },
    ],
    [],
  );

  return (
    <RequireAuth allowRoles={["UTILISATEUR", "ADMIN", "SUPER_ADMIN"]}>
      <AppShell title="Sommeil" section="me">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-sm text-zinc-600">Mesures sommeil/santé (paginé).</div>
          <PageSizeSelect
            value={pager.pageSize}
            onChange={(n) => {
              pager.setPageSize(n);
              pager.setPage(1);
            }}
          />
        </div>

        {q.isLoading ? (
          <div className="text-sm text-zinc-600">Chargement…</div>
        ) : q.isError ? (
          <div className="text-sm text-red-600">Erreur de chargement.</div>
        ) : (
          <>
            <DataTable columns={columns} rows={q.data?.data ?? []} />
            {q.data?.meta ? (
              <div className="mt-3">
                <Pagination meta={q.data.meta} onPageChange={pager.setPage} />
              </div>
            ) : null}
          </>
        )}
      </AppShell>
    </RequireAuth>
  );
}

