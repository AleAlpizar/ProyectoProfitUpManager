import { useCallback, useEffect, useMemo, useState } from "react";

type Me = { usuarioID: number; nombre: string; apellido?: string; correo: string; rol: "Administrador" | "Empleado" };
type LoginInput = { correo: string; password: string };

const API = process.env.NEXT_PUBLIC_API_BASE_URL;

export function useSession() {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) setToken(t);
    setLoading(false);
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!token) { setMe(null); return; }
      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("No autorizado");
        const data: Me = await res.json();
        setMe(data);
      } catch {
        localStorage.removeItem("token");
        setToken(null);
        setMe(null);
      }
    };
    run();
  }, [token]);

  const login = useCallback(async ({ correo, password }: LoginInput) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, password })
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e?.message || "Credenciales inválidas");
    }
    const data: { token: string; expireAt: string } = await res.json();
    localStorage.setItem("token", data.token);
    setToken(data.token);
    return true;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await fetch(`${API}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      setMe(null);
    }
  }, [token]);

  const isAuthenticated = !!me && !!token;
  const hasRole = useCallback((role: "Administrador" | "Empleado") => me?.rol === role, [me]);

  const authHeader = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

  return { me, token, authHeader, isAuthenticated, loading, login, logout, hasRole };
}
