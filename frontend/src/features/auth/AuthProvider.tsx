"use client";

import * as React from "react";

import { apiFetch, ApiError } from "@/lib/api";
import type { LoginRequest, LoginResponse, Utilisateur, ApiOkPayload } from "@/types/api";

type AuthState =
  | { status: "loading"; token: null; user: null }
  | { status: "anonymous"; token: null; user: null }
  | { status: "authenticated"; token: string; user: Utilisateur };

type AuthContextValue = AuthState & {
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
  reloadMe: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

async function fetchMe(token: string): Promise<Utilisateur> {
  const res = await apiFetch<ApiOkPayload<Utilisateur>>("/api/auth/me", { token });
  return res.data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    status: "loading",
    token: null,
    user: null,
  });

  const refresh = React.useCallback(async () => {
    try {
      const refreshed = await apiFetch<ApiOkPayload<LoginResponse>>("/api/auth/refresh", {
        method: "POST",
      });
      return refreshed.data.access_token;
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null;
      return null;
    }
  }, []);

  const reloadMe = React.useCallback(async () => {
    if (state.status !== "authenticated") return;
    const user = await fetchMe(state.token);
    setState({ status: "authenticated", token: state.token, user });
  }, [state.status, state.token]);

  const bootstrap = React.useCallback(async () => {
    const token = await refresh();
    if (!token) {
      setState({ status: "anonymous", token: null, user: null });
      return;
    }
    try {
      const user = await fetchMe(token);
      setState({ status: "authenticated", token, user });
    } catch {
      setState({ status: "anonymous", token: null, user: null });
    }
  }, [refresh]);

  React.useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const login = React.useCallback(async (payload: LoginRequest) => {
    const res = await apiFetch<ApiOkPayload<LoginResponse>>("/api/auth/login", {
      method: "POST",
      body: payload,
    });
    const token = res.data.access_token;
    const user = await fetchMe(token);
    setState({ status: "authenticated", token, user });
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await apiFetch<ApiOkPayload<{ message: string }>>("/api/auth/logout", { method: "POST" });
    } finally {
      setState({ status: "anonymous", token: null, user: null });
    }
  }, []);

  const value = React.useMemo<AuthContextValue>(() => {
    if (state.status === "authenticated") {
      return { ...state, login, logout, refresh, reloadMe };
    }
    if (state.status === "loading") {
      return { ...state, login, logout, refresh, reloadMe };
    }
    return { ...state, login, logout, refresh, reloadMe };
  }, [state, login, logout, refresh, reloadMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

