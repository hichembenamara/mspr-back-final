"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/features/auth/AuthProvider";
import type { UserRole } from "@/types/api";

export function RequireAuth({
  children,
  allowRoles,
}: {
  children: React.ReactNode;
  allowRoles?: UserRole[];
}) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (auth.status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [auth.status, router, pathname]);

  if (auth.status === "loading") {
    return <div className="p-6 text-sm text-zinc-600">Chargement…</div>;
  }

  if (auth.status === "anonymous") return null;

  if (allowRoles && !allowRoles.includes(auth.user.role)) {
    return (
      <div className="p-6">
        <div className="text-sm font-semibold">Accès refusé</div>
        <div className="text-sm text-zinc-600">Ton rôle ne permet pas d’accéder à cette page.</div>
      </div>
    );
  }

  return <>{children}</>;
}

