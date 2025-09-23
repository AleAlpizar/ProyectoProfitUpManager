import { useEffect, useState } from "react";
import { API_BASE } from "../helpers/apiClient";

type Health = { ok: boolean; db: boolean; message: string };

export default function HealthPage() {
  const [data, setData] = useState<Health | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/health/db`)
      .then(async (r) => {
        const t = await r.text();
        if (!r.ok) throw new Error(t || r.statusText);
        return JSON.parse(t) as Health;
      })
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Health</h1>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {!data && !err && <p>Verificando…</p>}
    </div>
  );
}
