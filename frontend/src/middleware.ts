import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/me", "/admin", "/super-admin"] as const;

function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  return Buffer.from(base64 + pad, "base64").toString("utf8");
}

function readJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function hasRole(payload: Record<string, unknown> | null, allowed: string[]) {
  const role = payload?.role;
  return typeof role === "string" && allowed.includes(role);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const refreshToken = req.cookies.get("refresh_token")?.value;
  if (!refreshToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Role guard (best effort): refresh token is a JWT containing the `role` claim.
  // We don't validate signature here (MVP routing guard); backend enforces auth.
  const payload = readJwtPayload(refreshToken);
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!hasRole(payload, ["ADMIN", "SUPER_ADMIN"])) return NextResponse.redirect(new URL("/me", req.url));
  }
  if (pathname === "/super-admin" || pathname.startsWith("/super-admin/")) {
    if (!hasRole(payload, ["SUPER_ADMIN"])) return NextResponse.redirect(new URL("/me", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/me/:path*", "/admin/:path*", "/super-admin/:path*"],
};

