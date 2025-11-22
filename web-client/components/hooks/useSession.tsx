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

function useProvideSession(): SessionContextValue {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
    } else {
      setMe(null);
      setReady(true); 
    }
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

        if (!res.ok) {
          throw new Error("No autorizado");
        }

        const data: Me = await res.json();
        if (!abort) {
          setMe(data);
          setReady(true);
        }
      } catch {
        if (!abort) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setMe(null);
          setReady(true);
        }
      }
    };

    validateToken();

    return () => {
      abort = true;
    };
  }, [token]);

  const login = useCallback(
    async ({ correo, password }: LoginInput) => {
      let res: Response;

      try {
        res = await fetch(`${API}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Correo: correo, Password: password }),
        });
      } catch (err) {
        console.error("Error de red llamando /auth/login", err);
        throw new Error(
          "No se pudo conectar con el servidor. Verifica que la API esté levantada."
        );
      }

      if (!res.ok) {
        let msg = "Credenciales inválidas";
        try {
          const e = await res.json();
          if (e?.message) msg = e.message;
        } catch {
        }
        throw new Error(msg);
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
      } catch (err) {
        console.error("Error cargando /auth/me después de login", err);
      }

      return true;
    },
    []
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
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setMe(null);
      setReady(true);
    }
  }, [token]);

  const isAuthenticated = !!me && !!token;

  const authHeader = useMemo<Record<string, string>>(
    () => (token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>)),
    [token]
  );

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
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}
