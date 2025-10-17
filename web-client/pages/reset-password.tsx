import React from "react";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function ResetPassword() {
  const router = useRouter();
  const [pwd, setPwd] = React.useState("");
  const [pwd2, setPwd2] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [token, setToken] = React.useState<string>("");

  // Espera a que el router esté listo para leer el token de la query
  React.useEffect(() => {
    if (!router.isReady) return;
    const q = router.query.token;
    setToken(typeof q === "string" ? q : "");
  }, [router.isReady, router.query.token]);

  const validate = () => {
    if (!pwd || pwd.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    if (pwd !== pwd2) return "Las contraseñas no coinciden.";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const v = validate();
    if (v) return setErr(v);

    if (!API) {
      setErr("Falta configurar NEXT_PUBLIC_API_BASE_URL.");
      return;
    }
    if (!token) {
      setErr("Token no encontrado. Verifica el enlace del correo.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/auth/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Respeta el shape que usabas: { Token, NewPassword }
        body: JSON.stringify({ Token: token, NewPassword: pwd }),
      });

      if (!res.ok) {
        let serverMsg = "";
        try {
          const j = await res.json();
          serverMsg = j?.message || j?.error || "";
        } catch { /* ignore */ }
        throw new Error(serverMsg || `No se pudo restablecer (HTTP ${res.status}).`);
      }

      setMsg("Contraseña actualizada. Ya puedes iniciar sesión.");
      setTimeout(() => router.replace("/login"), 1500);
    } catch (e: any) {
      setErr(e?.message || "Error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  // UI
  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-950 shadow-xl">
          <div className="px-6 py-7 sm:px-8">
            <div className="flex justify-center mb-4">
              <div className="h-9 w-9 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 grid place-items-center text-sm font-semibold">
                PU
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white text-center">
              Restablecer contraseña
            </h1>
            <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
              Define una nueva contraseña para tu cuenta.
            </p>

            <div aria-live="polite" className="mt-5 space-y-3">
              {msg && (
                <div className="rounded-md border border-emerald-300/50 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
                  {msg}
                </div>
              )}
              {err && (
                <div className="rounded-md border border-red-300/50 bg-red-400/10 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                  {err}
                </div>
              )}
            </div>

            {!token && (
              <div className="mt-3 rounded-md border border-yellow-300/50 bg-yellow-400/10 px-4 py-2 text-xs text-yellow-800 dark:text-yellow-200">
                Token no encontrado. Asegúrate de abrir el enlace desde tu correo.
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <label className="block text-xs font-semibold tracking-wide text-neutral-800 dark:text-neutral-200 mb-1">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  className={[
                    "w-full rounded-lg px-3 py-2 text-sm outline-none transition",
                    "bg-white dark:bg-neutral-900",
                    "text-neutral-900 dark:text-neutral-100 placeholder-neutral-400",
                    "border border-neutral-300 dark:border-neutral-700 focus:ring-2 focus:ring-emerald-300/60 dark:focus:ring-emerald-500/40",
                  ].join(" ")}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wide text-neutral-800 dark:text-neutral-200 mb-1">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={pwd2}
                  onChange={(e) => setPwd2(e.target.value)}
                  className={[
                    "w-full rounded-lg px-3 py-2 text-sm outline-none transition",
                    "bg-white dark:bg-neutral-900",
                    "text-neutral-900 dark:text-neutral-100 placeholder-neutral-400",
                    "border border-neutral-300 dark:border-neutral-700 focus:ring-2 focus:ring-emerald-300/60 dark:focus:ring-emerald-500/40",
                  ].join(" ")}
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 shadow-sm transition"
              >
                {loading ? "Guardando..." : "Guardar nueva contraseña"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-800 dark:text-neutral-100 text-sm font-medium px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
              >
                Volver al login
              </button>
            </form>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-neutral-500 dark:text-neutral-400">
          © {new Date().getFullYear()} Profit Up Manager
        </p>
      </div>
    </main>
  );
}

(ResetPassword as any).noChrome = true;

export default ResetPassword;
