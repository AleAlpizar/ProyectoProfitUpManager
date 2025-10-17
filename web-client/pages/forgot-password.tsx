import React from "react";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [okMsg, setOkMsg] = React.useState<string | null>(null);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);
  const [emailErr, setEmailErr] = React.useState<string | null>(null);

  const validateEmail = (val: string) => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
    return ok ? null : "Ingresa un correo válido.";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOkMsg(null);
    setErrMsg(null);

    const vErr = validateEmail(email);
    setEmailErr(vErr);
    if (vErr) return;

    if (!API) {
      setErrMsg("Falta configurar NEXT_PUBLIC_API_BASE_URL.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/auth/password/temp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Correo: email.trim() }),
      });

      if (!res.ok) {
        let serverMsg = "";
        try {
          const data = await res.json();
          serverMsg = data?.message || data?.error || "";
        } catch { }

        setErrMsg(
          serverMsg ||
            `No pudimos procesar la solicitud (HTTP ${res.status}). Intenta de nuevo.`
        );
        return;
      }

      setOkMsg("Si el correo existe, te enviamos una contraseña temporal.");
    } catch {
      setErrMsg("No pudimos procesar la solicitud. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

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
              Recuperar contraseña
            </h1>
            <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
              Te enviaremos una <span className="font-medium">contraseña temporal</span> si el correo existe.
            </p>

            <div aria-live="polite" className="mt-5 space-y-3">
              {okMsg && (
                <div className="rounded-md border border-emerald-300/50 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
                  {okMsg}
                </div>
              )}
              {errMsg && (
                <div className="rounded-md border border-red-300/50 bg-red-400/10 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                  {errMsg}
                </div>
              )}
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold tracking-wide text-neutral-800 dark:text-neutral-200 mb-1"
                >
                  Correo
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailErr) setEmailErr(null);
                  }}
                  autoComplete="email"
                  required
                  className={[
                    "w-full rounded-lg px-3 py-2 text-sm outline-none transition",
                    "bg-white dark:bg-neutral-900",
                    "text-neutral-900 dark:text-neutral-100 placeholder-neutral-400",
                    "border",
                    emailErr
                      ? "border-red-400 focus:ring-2 focus:ring-red-300/60 dark:focus:ring-red-500/40"
                      : "border-neutral-300 dark:border-neutral-700 focus:ring-2 focus:ring-emerald-300/60 dark:focus:ring-emerald-500/40",
                  ].join(" ")}
                  placeholder="tucorreo@empresa.com"
                  disabled={loading}
                  aria-invalid={!!emailErr}
                  aria-describedby={emailErr ? "email-error" : undefined}
                />
                {emailErr && (
                  <p id="email-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {emailErr}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 shadow-sm transition"
              >
                {loading ? "Enviando…" : "Enviar contraseña temporal"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-800 dark:text-neutral-100 text-sm font-medium px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
              >
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

(ForgotPasswordPage as any).noChrome = true;

export default ForgotPasswordPage;
