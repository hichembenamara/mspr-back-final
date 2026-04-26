"use client";

import * as React from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { PageSizeSelect, Pagination } from "@/components/ui/pagination";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { useApiQuery } from "@/hooks/useApiQuery";
import { usePagination } from "@/hooks/usePagination";
import type { Paginated } from "@/types/api";

type Row = Record<string, unknown>;

export default function AdminControlesQualitePage() {
  const pager = usePagination({ page: 1, pageSize: 20 });
  const [qText, setQText] = React.useState("");

  const q = useApiQuery<Paginated<Row>>(
    ["admin-controles-qualite", pager.page, pager.pageSize],
    `/api/controles-qualite-donnees?page=${pager.page}&page_size=${pager.pageSize}`,
  );

  const rows = React.useMemo(() => {
    const raw = q.data?.data ?? [];
    if (!qText) return raw;
    const needle = qText.toLowerCase();
    return raw.filter(
      (r) =>
        String(r["nom"] ?? "").toLowerCase().includes(needle) ||
        String(r["statut"] ?? "").toLowerCase().includes(needle),
    );
  }, [q.data, qText]);

  const columns = React.useMemo<ColumnDef<Row>[]>(
    () => [
      { key: "controle_id", header: "ID", cell: (r) => String(r["controle_id"] ?? "—") },
      { key: "nom", header: "Nom", cell: (r) => String(r["nom"] ?? "—") },
      {
        key: "est_bloquant",
        header: "Bloquant",
        cell: (r) => (
          <Badge variant={r["est_bloquant"] ? "danger" : "default"}>{r["est_bloquant"] ? "Oui" : "Non"}</Badge>
        ),
      },
      { key: "statut", header: "Statut", cell: (r) => String(r["statut"] ?? "—") },
    ],
    [],
  );

  return (
    <RequireAuth allowRoles={["ADMIN", "SUPER_ADMIN"]}>
      <AppShell title="Contrôles qualité" section="admin">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-3">
          <div className="space-y-1">
            <div className="text-sm text-zinc-600">Qualité des données (paginé).</div>
            <div className="w-full md:w-80">
              <label className="text-xs font-medium text-zinc-700">Filtre (local)</label>
              <Input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="nom, statut…" />
            </div>
          </div>
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
            <DataTable columns={columns} rows={rows} />
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

