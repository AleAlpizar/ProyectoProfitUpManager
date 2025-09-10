import { useRouter } from "next/router";
import React from "react";

 const Login = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  // const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState(false);
  const router = useRouter();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(false);

    if (!email.includes("@")) {
      setError("El correo no parece válido.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (password === "demo123") {
        setOk(true);
        router.replace("/")
      } else {
        setError("Credenciales inválidas (usa contraseña demo123 para probar).");
      }
    }, 900);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-secondary grid place-items-center p-6">
      <div className="w-full max-w-md">
        {/* Tarjeta */}
        <div className="rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10">
          <div className="p-6 sm:p-8">
            {/* Logo / marca */}
            {/* <div className="mx-auto mb-6 grid h-12 w-12 place-items-center rounded-full bg-primary text-white">
              <span className="text-lg font-bold">PU</span>
            </div> */}
            <h1 className="mb-1 text-center text-2xl font-bold text-secondary">Iniciar sesión</h1>
            <p className="mb-6 text-center text-sm text-secondary/70">
              Usa tu cuenta para ingresar al panel.
            </p>

            {/* Alertas */}
            {error && (
              <div className="mb-4 rounded-md bg-primary-foreground px-4 py-3 text-sm text-error text-danger ">
                {error}
              </div>
            )}
            {ok && (
              <div className="mb-4 rounded-md bg-success px-4 py-3 text-sm text-success-foreground">
                ¡Bienvenido! Autenticación de ejemplo correcta.
              </div>
            )}

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-primary/30"
                  placeholder="tucorreo@empresa.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-primary/30"
                  placeholder="••••••••"
                />
              </div>

              {/* <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30 dark:border-neutral-700"
                  />
                  Recordarme
                </label>
                <button type="button" className="text-sm text-primary underline-offset-2 hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div> */}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Ingresando…" : "Ingresar"}
              </button>

              <div className="pt-2 text-center text-xs text-secondary/70">
                Demo: usa cualquier correo y contraseña <code>demo123</code> para éxito.
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-secondary/60">
          © {new Date().getFullYear()} Profit Up Manager. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}


export default Login;