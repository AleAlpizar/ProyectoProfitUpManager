import React from "react";
import { useRouter } from "next/router";

const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

function ResetPassword() {
  const router = useRouter();
  const [pwd, setPwd] = React.useState("");
  const [pwd2, setPwd2] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [showPwd2, setShowPwd2] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [token, setToken] = React.useState<string>("");

  React.useEffect(() => {
    if (!router.isReady) return;
    const q = router.query.token;
    setToken(typeof q === "string" ? q.trim() : "");
  }, [router.isReady, router.query.token]);

  const validate = () => {
    if (!pwd || pwd.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres.";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "La contraseña debe incluir al menos una mayúscula.";
    }
    if (!/[a-z]/.test(pwd)) {
      return "La contraseña debe incluir al menos una minúscula.";
    }
    if (!/[0-9]/.test(pwd)) {
      return "La contraseña debe incluir al menos un número.";
    }
    if (pwd !== pwd2) {
      return "Las contraseñas no coinciden.";
    }
    return null;
  };

  const parseServerMessage = async (res: Response) => {
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        return data?.message || data?.error || "";
      }
      return (await res.text()).slice(0, 300);
    } catch {
      return "";
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

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
        body: JSON.stringify({ Token: token, NewPassword: pwd }),
      });

      if (!res.ok) {
        const serverMsg = await parseServerMessage(res);
        throw new Error(serverMsg || `No se pudo restablecer (HTTP ${res.status}).`);
      }

      setMsg("Contraseña actualizada. Ya puedes iniciar sesión.");
      setTimeout(() => {
        router.replace("/login");
      }, 1500);
    } catch (e: any) {
      setErr(e?.message || "Error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const vino = {
    bg: "bg-[#62053B]",
    hover: "hover:bg-[#7A094B]",
    ring: "focus:ring-[#62053B]/40",
  };

  return (
    <main className="grid min-h-screen place-items-center bg-neutral-900 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black p-8 shadow-[0_8px_30px_rgba(0,0,0,.35)]">
        <div className="mx-auto mb-1 grid h-10 w-10 place-items-center">
          <img
            src="/brand/pum-logo.jpg"
            alt="Profit Up Manager"
            className="h-10 w-auto rounded-md object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        <header className="mt-4 mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-[42px]">
            Restablecer contraseña
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Define una nueva contraseña para tu cuenta
          </p>
        </header>

        <div aria-live="polite" className="mb-4 space-y-3">
          {msg && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[13px] text-emerald-200">
              {msg}
            </div>
          )}

          {err && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-[13px] text-red-200">
              {err}
            </div>
          )}

          {!token && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-[13px] text-yellow-200">
              Token no encontrado. Asegúrate de abrir el enlace desde tu correo.
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate aria-busy={loading}>
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="block text-xs font-medium text-white">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPwd ? "text" : "password"}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoComplete="new-password"
                placeholder="Escribe tu nueva contraseña"
                disabled={loading}
                className={[
                  "block w-full rounded-lg border bg-neutral-900 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-white/40 outline-none transition",
                  "border-white/10 focus:border-white/20 focus:ring-2",
                  vino.ring,
                ].join(" ")}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-white/60 hover:text-white focus:outline-none"
                aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                disabled={loading}
              >
                {showPwd ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 3l18 18M10.585 10.585A2 2 0 1013.414 13.414M9.88 4.64A9.996 9.996 0 0121 12c-1.2 2.8-3.8 5.5-9 5.5-1.4 0-2.7-.2-3.9-.7M6.2 6.2C4.1 7.5 2.7 9.4 2 12c1.2 2.8 3.8 5.5 9 5.5 1.1 0 2.1-.1 3.1-.3" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[11px] text-white/40">
              Mínimo 8 caracteres, con mayúscula, minúscula y número.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="block text-xs font-medium text-white">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showPwd2 ? "text" : "password"}
                value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                autoComplete="new-password"
                placeholder="Repite la contraseña"
                disabled={loading}
                className={[
                  "block w-full rounded-lg border bg-neutral-900 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-white/40 outline-none transition",
                  "border-white/10 focus:border-white/20 focus:ring-2",
                  vino.ring,
                ].join(" ")}
              />
              <button
                type="button"
                onClick={() => setShowPwd2((s) => !s)}
                className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-white/60 hover:text-white focus:outline-none"
                aria-label={showPwd2 ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={showPwd2 ? "Ocultar contraseña" : "Mostrar contraseña"}
                disabled={loading}
              >
                {showPwd2 ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 3l18 18M10.585 10.585A2 2 0 1013.414 13.414M9.88 4.64A9.996 9.996 0 0121 12c-1.2 2.8-3.8 5.5-9 5.5-1.4 0-2.7-.2-3.9-.7M6.2 6.2C4.1 7.5 2.7 9.4 2 12c1.2 2.8 3.8 5.5 9 5.5 1.1 0 2.1-.1 3.1-.3" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className={[
              "inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition",
              vino.bg,
              vino.hover,
              "disabled:cursor-not-allowed disabled:opacity-60",
            ].join(" ")}
          >
            {loading ? "Guardando..." : "Guardar nueva contraseña"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full rounded-lg border border-white/10 bg-transparent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/5"
          >
            Volver al login
          </button>
        </form>

        <footer className="mt-8 text-center text-[10px] text-white/50">
          © {new Date().getFullYear()} Profit Up Manager
        </footer>
      </div>
    </main>
  );
}

(ResetPassword as any).noChrome = true;

export default ResetPassword;