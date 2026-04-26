"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth/AuthProvider";
import type { UserRole } from "@/types/api";

type NavItem = { href: string; label: string; roles?: UserRole[] };

const navMe: NavItem[] = [
  { href: "/me/dashboard", label: "Dashboard" },
  { href: "/me/mesures-biometriques", label: "Mesures" },
  { href: "/me/sommeil", label: "Sommeil" },
  { href: "/me/seances", label: "Séances" },
  { href: "/me/journal-alimentaire", label: "Journal alimentaire" },
];

const navAdmin: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/utilisateurs", label: "Utilisateurs", roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/executions-etl", label: "Exécutions ETL", roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/controles-qualite", label: "Contrôles qualité", roles: ["ADMIN", "SUPER_ADMIN"] },
];

const navSuper: NavItem[] = [
  { href: "/super-admin/dashboard", label: "Dashboard", roles: ["SUPER_ADMIN"] },
  { href: "/super-admin/organisations", label: "Organisations", roles: ["SUPER_ADMIN"] },
];

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-md px-3 py-2 text-sm transition-colors",
        active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100",
      )}
    >
      {children}
    </Link>
  );
}

export function AppShell({
  title,
  children,
  section,
}: {
  title: string;
  section: "me" | "admin" | "super-admin";
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const router = useRouter();

  const items = React.useMemo(() => {
    const role = auth.status === "authenticated" ? auth.user.role : null;
    const base =
      section === "me" ? navMe : section === "admin" ? navAdmin : navSuper;
    return base.filter((i) => !i.roles || (role ? i.roles.includes(role) : false));
  }, [auth.status, auth.user, section]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="flex">
        <aside className="hidden md:block w-64 shrink-0 border-r border-zinc-200 bg-white min-h-screen">
          <div className="p-4 border-b border-zinc-200">
            <div className="text-sm font-semibold">HealthAI Coaching</div>
            {auth.status === "authenticated" ? (
              <div className="mt-1 text-xs text-zinc-600">
                {auth.user.nom_utilisateur} • {auth.user.role}
              </div>
            ) : null}
          </div>
          <nav className="p-3 space-y-1">
            {items.map((i) => (
              <NavLink key={i.href} href={i.href}>
                {i.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-zinc-900">{title}</div>
              </div>
              <div className="flex items-center gap-2">
                {auth.status === "authenticated" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      await auth.logout();
                      router.replace("/login");
                    }}
                  >
                    Déconnexion
                  </Button>
                ) : null}
              </div>
            </div>
          </header>

          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

