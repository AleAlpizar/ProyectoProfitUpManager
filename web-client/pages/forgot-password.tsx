import React from "react";
import { useRouter } from "next/router";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
const ENDPOINT_PATH = "/auth/password/forgot";

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

  const parseServerMessage = async (res: Response) => {
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        return data?.message || data?.error || "";
      }
      const text = await res.text();
      return text?.slice(0, 300);
    } catch {
      return "";
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOkMsg(null);
    setErrMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const vErr = validateEmail(cleanEmail);
    setEmailErr(vErr);
    if (vErr) return;

    if (!API_BASE) {
      setErrMsg("Falta configurar NEXT_PUBLIC_API_BASE_URL.");
      return;
    }

    try {
      setLoading(true);

      const url = `${API_BASE}${ENDPOINT_PATH}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Correo: cleanEmail }),
      });

      if (!res.ok) {
        const serverMsg = await parseServerMessage(res);
        setErrMsg(serverMsg || `No pudimos procesar la solicitud (HTTP ${res.status}).`);
        return;
      }

      setOkMsg("Si el correo existe, te enviaremos un enlace para restablecer la contraseña.");
    } catch {
      setErrMsg("No pudimos procesar la solicitud. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const vino = {
    bg: "bg-[#62053B]",
    bgHover: "hover:bg-[#7A094B]",
    ring: "focus:ring-[#62053B]/40",
    outlineBorder: "border-[#62053B]/60",
    outlineText: "text-[#B10063]",
    outlineHover: "hover:bg-[#62053B]/8",
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(98,5,59,0.28),_transparent_35%),linear-gradient(to_bottom,_#171717,_#0a0a0a)] px-4">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center py-8">
        <div className="w-full rounded-3xl border border-white/10 bg-black/90 p-8 shadow-[0_20px_70px_rgba(0,0,0,.45)] backdrop-blur-sm sm:p-9">
          <div className="mb-4 flex justify-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 shadow-inner">
              <img
                src="/brand/pum-logo.jpg"
                alt="Profit Up Manager"
                className="h-10 w-auto rounded-md object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          </div>

          <header className="mx-auto mb-7 max-w-[360px] text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-[42px] sm:leading-[0.95]">
              Recuperar contraseña
            </h1>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Si el correo existe, te enviaremos un{" "}
              <span className="font-semibold text-white/75">enlace seguro</span>{" "}
              para restablecer tu contraseña.
            </p>
          </header>

          <div aria-live="polite" className="mb-4 space-y-3">
            {okMsg && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-200">
                {okMsg}
              </div>
            )}

            {errMsg && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-200">
                {errMsg}
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-white/85"
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
                placeholder="tucorreo@empresa.com"
                disabled={loading}
                aria-invalid={!!emailErr}
                aria-describedby={emailErr ? "email-error" : undefined}
                className={[
                  "h-12 w-full rounded-2xl border bg-neutral-900/90 px-4 text-sm text-white outline-none transition",
                  "placeholder-white/35",
                  "focus:ring-2",
                  "hover:border-white/20",
                  emailErr
                    ? "border-red-500/50 focus:ring-red-500/30"
                    : `border-white/10 ${vino.ring}`,
                ].join(" ")}
              />

              {emailErr && (
                <p id="email-error" className="mt-2 text-xs text-red-400">
                  {emailErr}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={[
                "h-12 w-full rounded-2xl px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(98,5,59,.28)] transition",
                vino.bg,
                vino.bgHover,
                "disabled:cursor-not-allowed disabled:opacity-60",
              ].join(" ")}
            >
              {loading ? "Enviando…" : "Enviar enlace de recuperación"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className={[
                "h-12 w-full rounded-2xl border bg-transparent px-4 text-sm font-medium transition",
                vino.outlineBorder,
                vino.outlineText,
                vino.outlineHover,
              ].join(" ")}
            >
              Volver a iniciar sesión
            </button>
          </form>

          <footer className="mt-8 border-t border-white/5 pt-5 text-center text-[10px] text-white/40">
            © {new Date().getFullYear()} Profit Up Manager
          </footer>
        </div>
      </div>
    </main>
  );
}

(ForgotPasswordPage as any).noChrome = true;
export default ForgotPasswordPage;