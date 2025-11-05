"use client";
import * as React from "react";
import { useApi } from "@/components/hooks/useApi";
import type { CalEvent } from "./calendar.types";

function fmt(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
export function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }

export function addMonths(d: Date, n: number) {
  const nd = new Date(d);
  nd.setMonth(nd.getMonth() + n);
  return nd;
}

export function useCalendar(onlyPendientes = true) {
  const { call } = useApi();
  const [current, setCurrent] = React.useState<Date>(new Date());
  const [soloPendientes, setSoloPendientes] = React.useState<boolean>(onlyPendientes);
  const [tipo, setTipo] = React.useState<string>(""); 

  const [data, setData] = React.useState<CalEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const from = React.useMemo(() => {
    const first = startOfMonth(current);
    const day = (first.getDay() + 6) % 7; 
    const monday = new Date(first);
    monday.setDate(first.getDate() - day);
    return monday;
  }, [current]);

  const to = React.useMemo(() => {
    const last = endOfMonth(current);
    const day = (last.getDay() + 6) % 7; 
    const sunday = new Date(last);
    sunday.setDate(last.getDate() + (6 - day));
    return sunday;
  }, [current]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        desde: fmt(from),
        hasta: fmt(to),
        soloPendientes: String(soloPendientes),
      });
      if (tipo) qs.set("tipo", tipo);
      const rows = await call<CalEvent[]>(`/api/vencimientos/calendario?${qs.toString()}`, { method: "GET" });
      setData(rows ?? []);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar el calendario.");
    } finally {
      setLoading(false);
    }
  }, [call, from, to, soloPendientes, tipo]);

  React.useEffect(() => { load().catch(() => {}); }, [load]);

  const nextMonth = () => setCurrent(c => addMonths(c, 1));
  const prevMonth = () => setCurrent(c => addMonths(c, -1));
  const setToday  = () => setCurrent(new Date());

  return {
    data, loading, error,
    current, setCurrent,
    from, to,
    nextMonth, prevMonth, setToday,
    soloPendientes, setSoloPendientes,
    tipo, setTipo,
    reload: load,
  };
}
