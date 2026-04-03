import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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

type SessionContextValue = {
  me: Me | null;
  token: string | null;
  authHeader: Record<string, string>;
  isAuthenticated: boolean;
  ready: boolean;
  login: (input: LoginInput) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (role: Rol) => boolean;
  isAdmin: boolean;
  isSeller: boolean;
  isEmployee: boolean;
};

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined
);

const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const setStoredToken = (token: string): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // noop
  }
};

const removeStoredToken = (): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // noop
  }
};

function useProvideSession(): SessionContextValue {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState<boolean>(false);

  const clearSession = useCallback(() => {
    removeStoredToken();
    setToken(null);
    setMe(null);
    setReady(true);
  }, []);

  useEffect(() => {
    const stored = getStoredToken();

    if (stored) {
      setToken(stored);
    } else {
      setMe(null);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== TOKEN_KEY) return;

      const newToken = event.newValue;
      if (!newToken) {
        setToken(null);
        setMe(null);
        setReady(true);
        return;
      }

      setToken(newToken);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorage);
      }
    };
  }, []);

  useEffect(() => {
    let abort = false;

    const validateToken = async () => {
      if (!token) {
        setMe(null);
        setReady(true);
        return;
      }

      setReady(false);

      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          throw new Error("UNAUTHORIZED");
        }

        if (!res.ok) {
          throw new Error(`VALIDATION_FAILED_${res.status}`);
        }

        const data: Me = await res.json();

        if (!abort) {
          setMe(data);
          setReady(true);
        }
      } catch (error: any) {
        if (abort) return;

        const isUnauthorized =
          error?.message === "UNAUTHORIZED" ||
          error?.message === "No autorizado";

        if (isUnauthorized) {
          clearSession();
          return;
        }

        setReady(true);
      }
    };

    validateToken();

    return () => {
      abort = true;
    };
  }, [token, clearSession]);

  const login = useCallback(
    async ({ correo, password }: LoginInput) => {
      const normalizedEmail = correo.trim().toLowerCase();
      let res: Response;

      setReady(false);

      try {
        res = await fetch(`${API}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Correo: normalizedEmail,
            Password: password,
          }),
        });
      } catch (err) {
        console.error("Error de red llamando /auth/login", err);
        setReady(true);
        throw new Error(
          "No se pudo conectar con el servidor. Verifica que la API esté levantada."
        );
      }

      if (!res.ok) {
        let msg = "Credenciales inválidas.";

        try {
          const e = await res.json();
          if (e?.message) msg = e.message;
        } catch {
          // noop
        }

        setReady(true);
        throw new Error(msg);
      }

      const data: { token: string; expireAt: string } = await res.json();

      setStoredToken(data.token);
      setToken(data.token);

      try {
        const meRes = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${data.token}` },
        });

        if (meRes.status === 401 || meRes.status === 403) {
          throw new Error("UNAUTHORIZED");
        }

        if (!meRes.ok) {
          throw new Error("No se pudo validar la sesión.");
        }

        const meData: Me = await meRes.json();
        setMe(meData);
        setReady(true);
      } catch (err: any) {
        console.error("Error cargando /auth/me después de login", err);

        if (err?.message === "UNAUTHORIZED") {
          clearSession();
          throw new Error("No se pudo validar la sesión del usuario.");
        }

        setReady(true);
        throw new Error(
          "La sesión se creó, pero no se pudo validar temporalmente el usuario. Intenta recargar la página."
        );
      }

      return true;
    },
    [clearSession]
  );

  const logout = useCallback(async () => {
    try {
      if (token) {
        await fetch(`${API}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } finally {
      clearSession();
    }
  }, [token, clearSession]);

  const isAuthenticated = !!me && !!token;

  const authHeader = useMemo((): Record<string, string> => {
    return token
      ? { Authorization: `Bearer ${token}` }
      : {};
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
    isAdmin: !!isAdmin,
    isSeller: !!isSeller,
    isEmployee: !!isEmployee,
  };
}

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value = useProvideSession();

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);

  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  return ctx;
}