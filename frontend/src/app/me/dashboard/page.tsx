"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { ApiOkPayload } from "@/types/api";

type MeDashboard = {
  utilisateur_id: number;
  dernier_poids_kg: number | null;
  dernier_imc: number | null;
  derniere_duree_sommeil_h: number | null;
  nb_seances: number;
  nb_plats: number;
  calories_journal: number;
};

export default function MeDashboardPage() {
  const q = useApiQuery<ApiOkPayload<MeDashboard>>(["me-dashboard"], "/api/me/dashboard");
  const d = q.data?.data;

  return (
    <RequireAuth allowRoles={["UTILISATEUR", "ADMIN", "SUPER_ADMIN"]}>
      <AppShell title="Dashboard utilisateur" section="me">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Poids</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {d?.dernier_poids_kg ?? "—"} <span className="text-sm font-normal text-zinc-600">kg</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sommeil</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {d?.derniere_duree_sommeil_h ?? "—"} <span className="text-sm font-normal text-zinc-600">h</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Calories (journal)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {d ? Math.round(d.calories_journal) : "—"} <span className="text-sm font-normal text-zinc-600">kcal</span>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Activité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Séances</span>
                <span className="font-medium">{d?.nb_seances ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Plats</span>
                <span className="font-medium">{d?.nb_plats ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">IMC</span>
                <span className="font-medium">{d?.dernier_imc ?? "—"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>État</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600">
              {q.isLoading ? "Chargement…" : q.isError ? "Erreur de chargement." : "Vue dense prête pour intégrer les courbes (poids/sommeil) et tendances."}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </RequireAuth>
  );
}

