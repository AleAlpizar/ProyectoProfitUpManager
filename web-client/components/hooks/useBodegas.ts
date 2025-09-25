import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "./useApi";                  
import type { Bodega, BodegaCreate } from "../../types/bodegas";

export function useBodegas() {
  const { call, ready } = useApi();                 
  const [items, setItems] = useState<Bodega[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ready) return;                           
    setInitialLoading(true);
    setError(null);
    try {
      const data = await call<Bodega[]>("/api/bodegas");
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar bodegas");
    } finally {
      setInitialLoading(false);
    }
  }, [call, ready]);

  useEffect(() => { load(); }, [load]);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const create = useCallback(async (payload: BodegaCreate) => {
    setCreating(true);
    setCreateError(null);
    try {
      await call<{ bodegaId: number }>(
        "/api/bodegas",
        { method: "POST", body: JSON.stringify(payload) }
      );
      await load();
    } catch (e: any) {
      setCreateError(e?.message ?? "No se pudo crear la bodega");
      throw e;
    } finally {
      setCreating(false);
    }
  }, [call, load]);

  const [toggling, setToggling] = useState(false);
  const toggleActive = useCallback(async (id: number, next: boolean) => {
    setToggling(true);
    try {
      setItems(prev => prev.map(b => b.bodegaId === id ? { ...b, isActive: next } : b));
    } finally {
      setToggling(false);
    }
  }, []);

  const state = useMemo(() => ({
    items, initialLoading, error, creating, createError, toggling
  }), [items, initialLoading, error, creating, createError, toggling]);

  return { ...state, load, setError, create, setCreateError, toggleActive };
}
