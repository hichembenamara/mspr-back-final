"use client";

import * as React from "react";

import { AppShell } from "@/components/layout/AppShell";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { PageSizeSelect, Pagination } from "@/components/ui/pagination";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { useApiQuery } from "@/hooks/useApiQuery";
import { usePagination } from "@/hooks/usePagination";
import type { Paginated } from "@/types/api";

type Row = Record<string, unknown>;

function contains(hay: unknown, needle: string) {
  if (!needle) return true;
  return String(hay ?? "").toLowerCase().includes(needle.toLowerCase());
}

export default function JournalAlimentairePage() {
  const pager = usePagination({ page: 1, pageSize: 20 });
  const [qText, setQText] = React.useState("");

  const q = useApiQuery<Paginated<Row>>(
    ["me-journal-alimentaire", pager.page, pager.pageSize],
    `/api/me/journal-alimentaire?page=${pager.page}&page_size=${pager.pageSize}`,
  );

  const columns = React.useMemo<ColumnDef<Row>[]>(
    () => [
      { key: "journal_id", header: "ID", cell: (r) => String(r["journal_id"] ?? "—") },
      { key: "consomme_le", header: "Date", cell: (r) => String(r["consomme_le"] ?? "—") },
      { key: "type_repas", header: "Repas", cell: (r) => String(r["type_repas"] ?? "—") },
      { key: "calories_kcal", header: "Kcal", cell: (r) => String(r["calories_kcal"] ?? "—") },
      { key: "quantite", header: "Qté", cell: (r) => String(r["quantite"] ?? "—") },
      { key: "unite_quantite", header: "Unité", cell: (r) => String(r["unite_quantite"] ?? "—") },
    ],
    [],
  );

  const rows = React.useMemo(() => {
    const raw = q.data?.data ?? [];
    if (!qText) return raw;
    return raw.filter((r) => contains(r["type_repas"], qText) || contains(r["aliment_nom_libre"], qText));
  }, [q.data, qText]);

  return (
    <RequireAuth allowRoles={["UTILISATEUR", "ADMIN", "SUPER_ADMIN"]}>
      <AppShell title="Journal alimentaire" section="me">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-3">
          <div className="space-y-1">
            <div className="text-sm text-zinc-600">Journal nutrition (paginé).</div>
            <div className="w-full md:w-80">
              <label className="text-xs font-medium text-zinc-700">Filtre (local)</label>
              <Input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="ex: DEJEUNER, …" />
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

