"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { ApiOkPayload } from "@/types/api";

type AdminDashboard = {
  nb_utilisateurs: number;
  nb_aliments: number;
  nb_executions_etl: number;
  taux_qualite_moyen: number;
  controles_bloquants: number;
};

export default function AdminDashboardPage() {
  const q = useApiQuery<ApiOkPayload<AdminDashboard>>(["admin-dashboard"], "/api/admin/dashboard");
  const d = q.data?.data;

  return (
    <RequireAuth allowRoles={["ADMIN", "SUPER_ADMIN"]}>
      <AppShell title="Dashboard admin" section="admin">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{d?.nb_utilisateurs ?? "—"}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Exécutions ETL</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{d?.nb_executions_etl ?? "—"}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Qualité (moyenne)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {d ? Math.round(d.taux_qualite_moyen) : "—"}{" "}
              <span className="text-sm font-normal text-zinc-600">%</span>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Référentiels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Aliments</span>
                <span className="font-medium">{d?.nb_aliments ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Contrôles bloquants</span>
                <span className="font-medium">{d?.controles_bloquants ?? "—"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>État</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600">
              {q.isLoading ? "Chargement…" : q.isError ? "Erreur de chargement." : "Vue dense prête pour brancher graphiques ETL (Recharts) et filtres."}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </RequireAuth>
  );
}

