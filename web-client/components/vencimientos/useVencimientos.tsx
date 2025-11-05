"use client";
import * as React from "react";
import { useApi } from "@/components/hooks/useApi";
import type {
  AlertRowDto,
  VencimientoDetalleDto,
  VencimientoUpdateDto,
  TipoDocumentoVtoDto,
} from "./types";

export function useAlertas(umbralDefault: number = 7) {
  const { call } = useApi();
  const [data, setData] = React.useState<AlertRowDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await call<AlertRowDto[]>(`/api/vencimientos/alertas?umbralDefault=${umbralDefault}`, { method: "GET" });
      setData(rows ?? []);
    } catch (e: any) {
      setError(e?.message ?? "No se pudieron cargar las alertas.");
    } finally {
      setLoading(false);
    }
  }, [call, umbralDefault]);

  React.useEffect(() => { load().catch(() => {}); }, [load]);

  return { data, loading, error, reload: load };
}

export function useTiposVencimiento() {
  const { call } = useApi();
  const [tipos, setTipos] = React.useState<TipoDocumentoVtoDto[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const rows = await call<TipoDocumentoVtoDto[]>(`/api/vencimientos/tipos`, { method: "GET" });
      setTipos(rows ?? []);
    } finally {
      setLoading(false);
    }
  }, [call]);

  React.useEffect(() => { load().catch(() => {}); }, [load]);

  return { tipos, loading, reload: load };
}

export function useVencimientoDetalle() {
  const { call } = useApi();
  const getById = React.useCallback(async (id: number) => {
    return await call<VencimientoDetalleDto>(`/api/vencimientos/${id}`, { method: "GET" });
  }, [call]);

  const update = React.useCallback(async (id: number, body: VencimientoUpdateDto) => {
    await call<void>(`/api/vencimientos/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }, [call]);

  return { getById, update };
}
