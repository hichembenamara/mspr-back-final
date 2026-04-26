"use client";

import * as React from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { PageSizeSelect, Pagination } from "@/components/ui/pagination";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { useApiQuery } from "@/hooks/useApiQuery";
import { usePagination } from "@/hooks/usePagination";
import type { Paginated } from "@/types/api";

type Row = Record<string, unknown>;

function toBadgeVariant(status: unknown) {
  const s = String(status ?? "").toUpperCase();
  if (["OK", "SUCCESS", "TERMINE", "DONE"].includes(s)) return "success";
  if (["ERROR", "ECHEC", "FAILED"].includes(s)) return "danger";
  if (["RUNNING", "EN_COURS"].includes(s)) return "warning";
  return "default";
}

export default function AdminExecutionsEtlPage() {
  const pager = usePagination({ page: 1, pageSize: 20 });
  const q = useApiQuery<Paginated<Row>>(
    ["admin-executions-etl", pager.page, pager.pageSize],
    `/api/executions-etl?page=${pager.page}&page_size=${pager.pageSize}`,
  );

  const columns = React.useMemo<ColumnDef<Row>[]>(
    () => [
      { key: "execution_id", header: "ID", cell: (r) => String(r["execution_id"] ?? "—") },
      { key: "lance_le", header: "Lancé le", cell: (r) => String(r["lance_le"] ?? "—") },
      {
        key: "statut",
        header: "Statut",
        cell: (r) => <Badge variant={toBadgeVariant(r["statut"])}>{String(r["statut"] ?? "—")}</Badge>,
      },
      { key: "taux_qualite", header: "Qualité", cell: (r) => String(r["taux_qualite"] ?? "—") },
    ],
    [],
  );

  return (
    <RequireAuth allowRoles={["ADMIN", "SUPER_ADMIN"]}>
      <AppShell title="Exécutions ETL" section="admin">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-sm text-zinc-600">Suivi des exécutions (paginé).</div>
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

