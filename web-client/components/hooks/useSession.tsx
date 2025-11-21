import { useCallback, useEffect, useMemo, useState } from "react";

export type Rol = "Administrador" | "Vendedor" | "Empleado";

export type Me = {
  usuarioID: number;
  nombre: string;
  apellido?: string | null;
  correo: string;
  rol: Rol;
};

export type LoginInput = { correo: string; password: string };

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
export const TOKEN_KEY = "auth_token";

export function useSession() {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    try {
      requestAnimationFrame(() => {
        const t =
          typeof window !== "undefined"
            ? localStorage.getItem(TOKEN_KEY)
            : null;
        if (t) setToken(t);
        setReady(true);
      });
    } catch {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    let abort = false;
    (async () => {
      if (!token) {
        setMe(null);
        return;
      }
      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("No autorizado");
        const data: Me = await res.json();
        if (!abort) setMe(data);
      } catch {
        if (!abort) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setMe(null);
        }
      }
    })();
    return () => {
      abort = true;
    };
  }, [token]);

  const login = useCallback(async ({ correo, password }: LoginInput) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Correo: correo, Password: password }),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e?.message || "Credenciales inválidas");
    }

    const data: { token: string; expireAt: string } = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);

    try {
      const meRes = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      if (meRes.ok) {
        const meData: Me = await meRes.json();
        setMe(meData);
      }
    } catch {
    }

    setReady(true);
    return true;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await fetch(`${API}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setMe(null);
    }
  }, [token]);

  const isAuthenticated = !!me && !!token;

  const authHeader = useMemo((): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const hasRole = useCallback(
    (role: Rol) => {
      if (!me) return false;
      if (me.rol === "Administrador") return true;
      return me.rol === role;
    },
    [me]
  );

  const isAdmin = me?.rol === "Administrador";
  const isSeller = me?.rol === "Vendedor";
  const isEmployee = me?.rol === "Empleado";

  return {
    me,
    token,
    authHeader,
    isAuthenticated,
    ready,
    login,
    logout,
    hasRole,
    isAdmin,
    isSeller,
    isEmployee,
  };
}
