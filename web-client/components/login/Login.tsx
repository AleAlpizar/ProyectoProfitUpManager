import React from "react";
import { useRouter } from "next/router";
import { useSession } from "@/hooks/useSession";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useSession();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  const isEmailValid = React.useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const isPassValid = password.length >= 6;
  const canSubmit = isEmailValid && isPassValid && !loading;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEmailValid) return setError("Correo inválido");
    if (!isPassValid) return setError("Mínimo 6 caracteres");

    try {
      setLoading(true);
      await login({ correo: email.trim(), password });
      router.replace("/");
    } catch (err: any) {
      setError(err?.message || "Error iniciando sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-neutral-900 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black p-8 shadow-[0_8px_30px_rgba(0,0,0,.35)]">
        <div className="mx-auto grid h-10 w-10 place-items-center rounded-md bg-white text-[13px] font-semibold text-black">
          PU
        </div>

        <header className="mt-6 mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-[42px]">
            Iniciar sesión
          </h1>
          <p className="mt-2 text-sm text-white/60">Accede a tu cuenta</p>
        </header>

        {error && (
          <div
            className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-[13px] text-red-200"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" aria-busy={loading}>
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-medium text-white">
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
              className="block w-full rounded-lg border border-white/10 bg-neutral-900 px-3.5 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-medium text-white">
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
                className="block w-full rounded-lg border border-white/10 bg-neutral-900 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/20"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-white/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPass ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3l18 18M10.585 10.585A2 2 0 1013.414 13.414M9.88 4.64A9.996 9.996 0 0121 12c-1.2 2.8-3.8 5.5-9 5.5-1.4 0-2.7-.2-3.9-.7M6.2 6.2C4.1 7.5 2.7 9.4 2 12c1.2 2.8 3.8 5.5 9 5.5 1.1 0 2.1-.1 3.1-.3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[11px] text-white/40">Mínimo 6 caracteres</p>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: "#A30862" }}
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="text-xs text-white/80 underline underline-offset-4 hover:text-white"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <footer className="mt-8 text-center text-[10px] text-white/50">
          © {new Date().getFullYear()} Profit Up Manager
        </footer>
      </div>
    </main>
  );
}

(LoginPage as any).noChrome = true;
