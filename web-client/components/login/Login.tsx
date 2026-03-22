import React from "react";
import { useRouter } from "next/router";
import { useSession } from ".././hooks/useSession";

export default function Login() {
  const router = useRouter();
  const { login, ready } = useSession();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isEmailValid = React.useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email]
  );

  const isPassValid = password.trim().length >= 1;
  const canSubmit = isEmailValid && isPassValid && !loading;

  const vino = {
    bg: "bg-[#62053B]",
    hover: "hover:bg-[#7A094B]",
    ring: "focus:ring-[#62053B]/40",
    border: "border-[#62053B]",
    text: "text-[#62053B]",
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!isEmailValid) return setError("Correo inválido");
    if (!isPassValid) return setError("La contraseña es obligatoria");

    try {
      setLoading(true);
      await login({ correo: cleanEmail, password });
    } catch (err: any) {
      setError(err?.message || "Error iniciando sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(98,5,59,0.28),_transparent_35%),linear-gradient(to_bottom,_#171717,_#0a0a0a)] px-4">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center py-8">
        <div className="w-full rounded-3xl border border-white/10 bg-black/80 p-8 shadow-[0_20px_70px_rgba(0,0,0,.45)] backdrop-blur-sm sm:p-9">
          <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5">
            <img
              src="/brand/pum-logo.jpg"
              alt="Profit Up Manager"
              className="h-10 w-auto rounded-md object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>

          <header className="mb-8 mt-5 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-[40px]">
              Iniciar sesión
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Accede a tu cuenta
            </p>
          </header>

          {error && (
            <div
              className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-200 shadow-inner"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={onSubmit}
            className="space-y-4"
            aria-busy={loading || !ready}
          >
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-medium text-white/90">
                Correo
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="tucorreo@empresa.com"
                aria-invalid={!!email && !isEmailValid}
                className={[
                  "block h-11 w-full rounded-xl border bg-neutral-900/90 px-3.5 text-sm text-white placeholder-white/35 outline-none transition",
                  "border-white/10 focus:border-white/20 focus:ring-2",
                  "hover:border-white/20",
                  vino.ring,
                ].join(" ")}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-medium text-white/90">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!password && !isPassValid}
                  className={[
                    "block h-11 w-full rounded-xl border bg-neutral-900/90 px-3.5 pr-11 text-sm text-white placeholder-white/35 outline-none transition",
                    "border-white/10 focus:border-white/20 focus:ring-2",
                    "hover:border-white/20",
                    vino.ring,
                  ].join(" ")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute inset-y-0 right-1.5 my-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/5 hover:text-white focus:outline-none"
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  title={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? (
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
              disabled={!canSubmit || !ready}
              className={[
                "inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(98,5,59,.28)] transition",
                vino.bg,
                vino.hover,
                "disabled:cursor-not-allowed disabled:opacity-60",
              ].join(" ")}
            >
              {loading ? "Ingresando…" : "Ingresar"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="text-xs font-medium text-white/80 underline underline-offset-4 transition hover:text-white"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <footer className="mt-8 border-t border-white/5 pt-4 text-center text-[10px] tracking-wide text-white/40">
            © {new Date().getFullYear()} Profit Up Manager
          </footer>
        </div>
      </div>
    </main>
  );
}