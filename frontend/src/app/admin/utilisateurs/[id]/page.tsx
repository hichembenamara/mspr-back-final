"use client";

import { useParams } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { ApiOkPayload, Utilisateur } from "@/types/api";

export default function AdminUtilisateurDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const q = useApiQuery<ApiOkPayload<Utilisateur>>(["admin-utilisateur", id], `/api/utilisateurs/${id}`, {
    enabled: Number.isFinite(id) && id > 0,
  });
  const u = q.data?.data;

  return (
    <RequireAuth allowRoles={["ADMIN", "SUPER_ADMIN"]}>
      <AppShell title={`Utilisateur #${id}`} section="admin">
        <Card>
          <CardHeader>
            <CardTitle>Détails</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {q.isLoading ? (
              <div className="text-zinc-600">Chargement…</div>
            ) : q.isError ? (
              <div className="text-red-600">Erreur de chargement.</div>
            ) : !u ? (
              <div className="text-zinc-600">Introuvable.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs font-medium text-zinc-600">Pseudo</div>
                  <div className="font-medium">{u.nom_utilisateur}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-zinc-600">Email</div>
                  <div className="font-medium">{u.email}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-zinc-600">Rôle</div>
                  <div className="font-medium">{u.role}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-zinc-600">Statut</div>
                  <div className="font-medium">{u.statut}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-zinc-600">Organisation</div>
                  <div className="font-medium">{u.organisation_id}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-zinc-600">ID</div>
                  <div className="font-medium">{u.utilisateur_id}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </AppShell>
    </RequireAuth>
  );
}

