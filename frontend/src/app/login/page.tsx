"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError } from "@/lib/api";

const schema = z.object({
  identifiant: z.string().min(1, "Identifiant requis"),
  mot_de_passe: z.string().min(1, "Mot de passe requis"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifiant: "", mot_de_passe: "" },
  });

  React.useEffect(() => {
    if (auth.status === "authenticated") {
      const role = auth.user.role;
      if (role === "SUPER_ADMIN") router.replace("/super-admin/dashboard");
      else if (role === "ADMIN") router.replace("/admin/dashboard");
      else router.replace("/me/dashboard");
    }
  }, [auth.status, auth.user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <Alert variant="danger">{error}</Alert> : null}
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit(async (values) => {
              setError(null);
              try {
                await auth.login(values);
                const next =
                  typeof window === "undefined"
                    ? null
                    : new URLSearchParams(window.location.search).get("next");
                if (next) router.replace(next);
                else {
                  const role = auth.status === "authenticated" ? auth.user.role : null;
                  if (role === "SUPER_ADMIN") router.replace("/super-admin/dashboard");
                  else if (role === "ADMIN") router.replace("/admin/dashboard");
                  else router.replace("/me/dashboard");
                }
              } catch (e) {
                if (e instanceof ApiError) setError(e.message);
                else setError("Erreur inconnue.");
              }
            })}
          >
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">Identifiant</label>
              <Input autoComplete="username" {...form.register("identifiant")} />
              {form.formState.errors.identifiant ? (
                <div className="text-xs text-red-600">{form.formState.errors.identifiant.message}</div>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">Mot de passe</label>
              <Input type="password" autoComplete="current-password" {...form.register("mot_de_passe")} />
              {form.formState.errors.mot_de_passe ? (
                <div className="text-xs text-red-600">{form.formState.errors.mot_de_passe.message}</div>
              ) : null}
            </div>
            <Button className="w-full" type="submit" disabled={form.formState.isSubmitting || auth.status === "loading"}>
              Se connecter
            </Button>
          </form>
          <div className="text-xs text-zinc-600">
            En dev, tu peux utiliser les comptes du backend (ex: <span className="font-medium">alice/secret</span> ou{" "}
            <span className="font-medium">admin/admin-secret</span>).
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

