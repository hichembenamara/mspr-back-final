"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { ApiOkPayload } from "@/types/api";

type SuperDashboard = {
  nb_utilisateurs: number;
  nb_admins: number;
  nb_executions_etl: number;
  qualite_min: number;
  qualite_max: number;
};

export default function SuperAdminDashboardPage() {
  const q = useApiQuery<ApiOkPayload<SuperDashboard>>(["super-dashboard"], "/api/super-admin/dashboard");
  const d = q.data?.data;

  return (
    <RequireAuth allowRoles={["SUPER_ADMIN"]}>
      <AppShell title="Dashboard super-admin" section="super-admin">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{d?.nb_utilisateurs ?? "—"}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Admins</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{d?.nb_admins ?? "—"}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Qualité (min/max)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {d ? `${Math.round(d.qualite_min)} / ${Math.round(d.qualite_max)}` : "—"}{" "}
              <span className="text-sm font-normal text-zinc-600">%</span>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </RequireAuth>
  );
}

