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

export default function SeancesPage() {
  const pager = usePagination({ page: 1, pageSize: 20 });
  const q = useApiQuery<Paginated<Row>>(
    ["me-seances", pager.page, pager.pageSize],
    `/api/me/seances?page=${pager.page}&page_size=${pager.pageSize}`,
  );

  const columns = React.useMemo<ColumnDef<Row>[]>(
    () => [
      { key: "seance_id", header: "ID", cell: (r) => String(r["seance_id"] ?? "—") },
      { key: "date_seance", header: "Date", cell: (r) => String(r["date_seance"] ?? "—") },
      { key: "type_entrainement", header: "Type", cell: (r) => String(r["type_entrainement"] ?? "—") },
      { key: "duree_seance_min", header: "Durée (min)", cell: (r) => String(r["duree_seance_min"] ?? "—") },
      { key: "calories_brulees_total", header: "Calories", cell: (r) => String(r["calories_brulees_total"] ?? "—") },
    ],
    [],
  );

  return (
    <RequireAuth allowRoles={["UTILISATEUR", "ADMIN", "SUPER_ADMIN"]}>
      <AppShell title="Séances" section="me">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-sm text-zinc-600">Historique des séances (paginé).</div>
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

