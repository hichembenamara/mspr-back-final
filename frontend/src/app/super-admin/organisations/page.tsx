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

export default function OrganisationsPage() {
  const pager = usePagination({ page: 1, pageSize: 20 });
  const [qText, setQText] = React.useState("");

  const q = useApiQuery<Paginated<Row>>(
    ["super-organisations", pager.page, pager.pageSize],
    `/api/organisations?page=${pager.page}&page_size=${pager.pageSize}`,
  );

  const rows = React.useMemo(() => {
    const raw = q.data?.data ?? [];
    if (!qText) return raw;
    const needle = qText.toLowerCase();
    return raw.filter((r) => String(r["nom"] ?? "").toLowerCase().includes(needle));
  }, [q.data, qText]);

  const columns = React.useMemo<ColumnDef<Row>[]>(
    () => [
      { key: "organisation_id", header: "ID", cell: (r) => String(r["organisation_id"] ?? "—") },
      { key: "nom", header: "Nom", cell: (r) => String(r["nom"] ?? "—") },
      { key: "adresse", header: "Adresse", cell: (r) => String(r["adresse"] ?? "—") },
    ],
    [],
  );

  return (
    <RequireAuth allowRoles={["SUPER_ADMIN"]}>
      <AppShell title="Organisations" section="super-admin">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-3">
          <div className="space-y-1">
            <div className="text-sm text-zinc-600">CRUD (lecture) paginé.</div>
            <div className="w-full md:w-80">
              <label className="text-xs font-medium text-zinc-700">Filtre (local)</label>
              <Input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="nom…" />
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

