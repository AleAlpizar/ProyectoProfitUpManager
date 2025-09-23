import { useRouter } from "next/router";
import React from "react";
import { useSession } from "@/hooks/useSession";



const Login = () => {
  const { login, isAuthenticated } = useSession();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.includes("@")) return setError("El correo no parece válido.");
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");

    try {
      setLoading(true);
      await login({ correo: email, password });
      router.replace("/");
    } catch (err: any) {
      setError(err?.message || "Error iniciando sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-secondary grid place-items-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10">
          <div className="p-6 sm:p-8">
            <h1 className="mb-1 text-center text-2xl font-bold text-secondary">Iniciar sesión</h1>
            <p className="mb-6 text-center text-sm text-secondary/70">Usa tu cuenta para ingresar al panel.</p>

            {error && (
              <div className="mb-4 rounded-md bg-primary-foreground px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium">Correo electrónico</label>
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
                <label htmlFor="password" className="mb-1 block text-sm font-medium">Contraseña</label>
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

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Ingresando…" : "Ingresar"}
              </button>
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
