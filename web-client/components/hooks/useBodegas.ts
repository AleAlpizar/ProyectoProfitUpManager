import * as React from "react";
import { useApi } from "./useApi";

export type BodegaDto = {
  bodegaID: number;
  codigo?: string | null;
  nombre: string;
  direccion?: string | null;
  contacto?: string | null;
  isActive: boolean | number;
};

type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message?.trim()) return error.message.trim();
  return fallback;
}

function normalizeBodega(row: BodegaDto): BodegaDto {
  return {
    ...row,
    codigo: row.codigo ?? null,
    direccion: row.direccion ?? null,
    contacto: row.contacto ?? null,
    isActive: typeof row.isActive === "number" ? row.isActive === 1 : !!row.isActive,
  };
}

export function useBodegas() {
  const { get } = useApi();
  const [data, setData] = React.useState<BodegaDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await get<Paged<BodegaDto> | BodegaDto[]>(
        "/api/bodegas?soloActivas=true&page=1&pageSize=1000"
      );

      const items = Array.isArray(res) ? res : res?.items ?? [];
      setData(items.map(normalizeBodega));
    } catch (e: unknown) {
      setError(getErrorMessage(e, "No se pudo cargar bodegas."));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [get]);

  React.useEffect(() => {
    load().catch(() => {});
  }, [load]);

  return { data, load, loading, error };
}