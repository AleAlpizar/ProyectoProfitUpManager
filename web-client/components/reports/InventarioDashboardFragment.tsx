"use client";

import React from "react";
import useSWR from "swr";
import {
  AreaChart as RechartsAreaChart,
  Area as RechartsArea,
  CartesianGrid as RechartsCartesianGrid,
  ResponsiveContainer as RechartsResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
} from "recharts";

const ResponsiveContainer = RechartsResponsiveContainer as any;
const AreaChart = RechartsAreaChart as any;
const Area = RechartsArea as any;
const CartesianGrid = RechartsCartesianGrid as any;
const Tooltip = RechartsTooltip as any;
const XAxis = RechartsXAxis as any;
const YAxis = RechartsYAxis as any;

const ACCENT = "#b1005f";
const ACCENT_SOFT = "#f472b6";

type RangeKey = "30d" | "90d" | "year" | "all" | "custom";

type ProductoOption = {
  ProductoID?: number;
  productoID?: number;
  id?: number;
  Nombre?: string;
  nombre?: string;
  SKU?: string;
  Sku?: string;
  sku?: string;
};

type BodegaOption = {
  BodegaID?: number;
  bodegaID?: number;
  Id?: number;
  id?: number;
  Nombre?: string;
  nombre?: string;
};

type DashboardResponse = {
  fechaDesde?: string;
  FechaDesde?: string;
  fechaHasta?: string;
  FechaHasta?: string;
  stockActual?: any[];
  StockActual?: any[];
  stockCritico?: any[];
  StockCritico?: any[];
  valorizacion?: any[];
  Valorizacion?: any[];
  kardex?: any[];
  Kardex?: any[];
  resumenMovimientos?: any[];
  ResumenMovimientos?: any[];
  rotacion?: any[];
  Rotacion?: any[];
  productosSinMovimiento?: any[];
  ProductosSinMovimiento?: any[];
  cobertura?: any[];
  Cobertura?: any[];
};

const formatCurrency = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  });

const formatNumber = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString("es-CR");

const formatShortDate = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

const formatDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const pillClass = (active: boolean) =>
  [
    "rounded-full px-3.5 py-1.5 text-xs border transition-all duration-200",
    active
      ? "bg-[#b1005f] border-[#f9a8d4] text-white shadow-[0_8px_24px_rgba(177,0,95,0.28)]"
      : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:border-white/20",
  ].join(" ");

const panelClass =
  "rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(2,6,23,0.92))] shadow-[0_22px_60px_rgba(0,0,0,0.32)] backdrop-blur-sm";

const tableHeadClass =
  "sticky top-0 bg-[#07111F]/95 backdrop-blur text-[11px] uppercase tracking-wide text-slate-400";

const sectionTitleClass = "text-sm font-semibold tracking-wide text-slate-100";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5151";

const buildAuthHeaders = (): Record<string, string> => {
  if (typeof window === "undefined") return {};

  const headers: Record<string, string> = {};

  try {
    const lsToken =
      window.localStorage.getItem("auth_token") ??
      window.localStorage.getItem("sessionToken") ??
      window.localStorage.getItem("authToken") ??
      window.localStorage.getItem("token");

    if (lsToken) {
      headers["Authorization"] = `Bearer ${lsToken}`;
      headers["X-Session-Token"] = lsToken;
    }

    const cookie = document.cookie ?? "";
    const match =
      cookie.match(/session_token=([^;]+)/) ??
      cookie.match(/authToken=([^;]+)/) ??
      cookie.match(/token=([^;]+)/);

    if (match) {
      const token = decodeURIComponent(match[1]);
      if (!headers["Authorization"]) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      if (!headers["X-Session-Token"]) {
        headers["X-Session-Token"] = token;
      }
    }
  } catch (err) {
    console.warn("No se pudo leer token de autenticación en el navegador", err);
  }

  return headers;
};

const fetcher = async (relativeUrl: string) => {
  const url = `${apiBase}${relativeUrl}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...buildAuthHeaders(),
  };

  const res = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    if (
      relativeUrl.startsWith("/api/productos/mini") ||
      relativeUrl.startsWith("/api/bodegas")
    ) {
      return [];
    }

    throw new Error("HTTP_401");
  }

  if (!res.ok) {
    let message = `HTTP_${res.status}`;

    try {
      const errorBody = await res.json();
      message = errorBody?.message || errorBody?.Message || message;
    } catch {
      // sin cuerpo json
    }

    throw new Error(message);
  }

  return res.json();
};

export const InventarioDashboardFragment: React.FC = () => {
  const [range, setRange] = React.useState<RangeKey>("30d");
  const [customDesde, setCustomDesde] = React.useState("");
  const [customHasta, setCustomHasta] = React.useState("");
  const [appliedCustom, setAppliedCustom] = React.useState<{
    desde?: string;
    hasta?: string;
  } | null>(null);
  const [rangeValidationMessage, setRangeValidationMessage] =
    React.useState<string>("");

  const [selectedProductoId, setSelectedProductoId] =
    React.useState<string>("all");
  const [selectedBodegaId, setSelectedBodegaId] =
    React.useState<string>("all");

  const [stockProductoId, setStockProductoId] =
    React.useState<string>("all");
  const [stockBodegaId, setStockBodegaId] = React.useState<string>("all");

  const [kardexProductoId, setKardexProductoId] =
    React.useState<string>("all");
  const [kardexBodegaId, setKardexBodegaId] =
    React.useState<string>("all");
  const [kardexTipo, setKardexTipo] =
    React.useState<"all" | "Entrada" | "Salida">("all");
  const [kardexDesde, setKardexDesde] = React.useState<string>("");
  const [kardexHasta, setKardexHasta] = React.useState<string>("");
  const [kardexValidationMessage, setKardexValidationMessage] =
    React.useState<string>("");

  const { data: productosMini } = useSWR("/api/productos/mini?estado=activos", fetcher);
  const { data: bodegasMini } = useSWR("/api/bodegas", fetcher);

  const bodegasList = React.useMemo<BodegaOption[]>(() => {
    if (!bodegasMini) return [];
    if (Array.isArray(bodegasMini)) return bodegasMini;
    if (Array.isArray(bodegasMini.items)) return bodegasMini.items;
    if (Array.isArray(bodegasMini.data)) return bodegasMini.data;
    if (Array.isArray(bodegasMini.bodegas)) return bodegasMini.bodegas;
    if (Array.isArray(bodegasMini.results)) return bodegasMini.results;
    return [];
  }, [bodegasMini]);

  const productosList = React.useMemo<ProductoOption[]>(() => {
    if (!productosMini) return [];
    if (Array.isArray(productosMini)) return productosMini;
    if (Array.isArray(productosMini.items)) return productosMini.items;
    if (Array.isArray(productosMini.data)) return productosMini.data;
    if (Array.isArray(productosMini.productos)) return productosMini.productos;
    if (Array.isArray(productosMini.results)) return productosMini.results;
    return [];
  }, [productosMini]);

  const apiUrl = React.useMemo(() => {
    const params = new URLSearchParams();
    const today = new Date();

    if (range === "custom" && appliedCustom) {
      if (appliedCustom.desde) params.set("fechaDesde", appliedCustom.desde);
      if (appliedCustom.hasta) params.set("fechaHasta", appliedCustom.hasta);
    } else {
      let from: Date | undefined;
      let to: Date | undefined;

      if (range === "30d") {
        to = today;
        from = new Date(today);
        from.setDate(to.getDate() - 29);
      } else if (range === "90d") {
        to = today;
        from = new Date(today);
        from.setDate(to.getDate() - 89);
      } else if (range === "year") {
        to = today;
        from = new Date(today.getFullYear(), 0, 1);
      }

      if (from) params.set("fechaDesde", formatDateLocal(from));
      if (to) params.set("fechaHasta", formatDateLocal(to));
    }

    if (selectedProductoId !== "all") {
      params.set("productoId", selectedProductoId);
    }

    if (selectedBodegaId !== "all") {
      params.set("bodegaId", selectedBodegaId);
    }

    const qs = params.toString();
    return `/api/reportes/inventario/dashboard${qs ? `?${qs}` : ""}`;
  }, [range, appliedCustom, selectedProductoId, selectedBodegaId]);

  const shouldFetchDashboard = !rangeValidationMessage;

  const { data, error, isLoading } = useSWR<DashboardResponse>(
    shouldFetchDashboard ? apiUrl : null,
    fetcher
  );

  const stockActual = data?.stockActual ?? data?.StockActual ?? [];
  const productosCriticosRaw = data?.stockCritico ?? data?.StockCritico ?? [];
  const valorizacionRaw = data?.valorizacion ?? data?.Valorizacion ?? [];
  const kardex = data?.kardex ?? data?.Kardex ?? [];
  const movimientosPorTipoRaw =
    data?.resumenMovimientos ?? data?.ResumenMovimientos ?? [];
  const rotacion = data?.rotacion ?? data?.Rotacion ?? [];
  const productosSinMovimiento =
    data?.productosSinMovimiento ?? data?.ProductosSinMovimiento ?? [];
  const coberturaRaw = data?.cobertura ?? data?.Cobertura ?? [];

  const productosCriticosAgrupados = React.useMemo(() => {
    if (!Array.isArray(productosCriticosRaw)) return [];

    const map = new Map<string, any>();

    productosCriticosRaw.forEach((p: any) => {
      const prodId = p.ProductoID ?? p.productoID ?? p.id;
      if (prodId == null) return;

      const key = String(prodId);
      const disponible =
        p.StockDisponible ??
        p.stockDisponible ??
        p.Disponible ??
        p.disponible ??
        p.StockActual ??
        p.stockActual ??
        p.StockTotal ??
        p.stockTotal ??
        p.Cantidad ??
        p.cantidad ??
        0;

      const umbral =
        p.UmbralCritico ?? p.umbralCritico ?? p.Umbral ?? p.umbral ?? 0;

      const existing = map.get(key);
      if (existing) {
        existing.disponible += Number(disponible ?? 0);
        existing.umbral = Math.max(existing.umbral, Number(umbral ?? 0));
      } else {
        map.set(key, {
          ProductoID: prodId,
          Nombre:
            p.Nombre ??
            p.nombre ??
            p.NombreProducto ??
            p.nombreProducto ??
            "(Producto)",
          SKU: p.Sku ?? p.SKU ?? p.sku ?? "",
          disponible: Number(disponible ?? 0),
          umbral: Number(umbral ?? 0),
        });
      }
    });

    return Array.from(map.values()).sort(
      (a: any, b: any) =>
        a.disponible - b.disponible ||
        String(a.Nombre).localeCompare(String(b.Nombre))
    );
  }, [productosCriticosRaw]);

  const valorizacionPorBodega = React.useMemo(() => {
    if (!Array.isArray(valorizacionRaw)) return [];

    const map = new Map<string, any>();

    valorizacionRaw.forEach((v: any) => {
      const bodegaId = v.BodegaID ?? v.bodegaID ?? 0;
      const key = String(bodegaId);

      const nombreBodega =
        v.NombreBodega ??
        v.nombreBodega ??
        v.Bodega ??
        v.bodega ??
        (bodegaId ? `Bodega ${bodegaId}` : "General");

      const valorCostoRow = Number(
        v.ValorCostoTotal ??
          v.valorCostoTotal ??
          v.ValorCosto ??
          v.valorCosto ??
          0
      );

      const valorVentaRow = Number(
        v.ValorVentaTotal ??
          v.valorVentaTotal ??
          v.ValorVenta ??
          v.valorVenta ??
          0
      );

      const existing = map.get(key);
      if (existing) {
        existing.valorCosto += valorCostoRow;
        existing.valorVenta += valorVentaRow;
      } else {
        map.set(key, {
          BodegaID: bodegaId,
          NombreBodega: nombreBodega,
          valorCosto: valorCostoRow,
          valorVenta: valorVentaRow,
        });
      }
    });

    return Array.from(map.values()).sort((a: any, b: any) =>
      String(a.NombreBodega).localeCompare(String(b.NombreBodega))
    );
  }, [valorizacionRaw]);

  const resumenMovimientosChart = React.useMemo(() => {
    if (!Array.isArray(movimientosPorTipoRaw)) return [];

    const map = new Map<string, number>();

    movimientosPorTipoRaw.forEach((m: any) => {
      let tipo =
        m.TipoMovimiento ?? m.tipoMovimiento ?? m.Tipo ?? m.tipo ?? "Otro";

      const tNorm = String(tipo).trim().toLowerCase();
      if (tNorm.startsWith("ent")) tipo = "Entrada";
      else if (tNorm.startsWith("sal")) tipo = "Salida";

      const cantidad = Number(
        m.CantidadTotal ?? m.cantidadTotal ?? m.Cantidad ?? m.cantidad ?? 0
      );

      if (!Number.isNaN(cantidad)) {
        map.set(tipo, (map.get(tipo) ?? 0) + cantidad);
      }
    });

    return Array.from(map.entries())
      .map(([tipo, cantidad]) => ({ tipo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [movimientosPorTipoRaw]);

  const coberturaAgrupada = React.useMemo(() => {
    if (!Array.isArray(coberturaRaw)) return [];

    return coberturaRaw
      .map((c: any) => ({
        ProductoID: c.ProductoID ?? c.productoID ?? c.id,
        Nombre:
          c.Nombre ??
          c.nombre ??
          c.NombreProducto ??
          c.nombreProducto ??
          "(Producto)",
        SKU: c.Sku ?? c.SKU ?? c.sku ?? "",
        stock: Number(
          c.StockDisponible ??
            c.stockDisponible ??
            c.StockActual ??
            c.stockActual ??
            c.Stock ??
            c.stock ??
            0
        ),
        ventaDiaria: Number(
          c.VentaDiariaPromedio ??
            c.ventaDiariaPromedio ??
            c.ConsumoPromedioDia ??
            c.consumoPromedioDia ??
            c.VentaDiaria ??
            c.ventaDiaria ??
            0
        ),
        diasCobertura: Number(c.DiasCobertura ?? c.diasCobertura ?? 0),
      }))
      .sort((a: any, b: any) => a.diasCobertura - b.diasCobertura);
  }, [coberturaRaw]);

  const stockActualFiltrado = React.useMemo(() => {
    if (!Array.isArray(stockActual)) return [];

    return stockActual.filter((r: any) => {
      const prodId = String(
        r.ProductoID ?? r.productoID ?? r.Id ?? r.id ?? ""
      );
      const bodId = String(
        r.BodegaID ?? r.bodegaID ?? r.BodegaId ?? r.bodegaId ?? ""
      );

      if (stockProductoId !== "all" && prodId !== stockProductoId) {
        return false;
      }

      if (stockBodegaId !== "all" && bodId !== stockBodegaId) {
        return false;
      }

      return true;
    });
  }, [stockActual, stockProductoId, stockBodegaId]);

  const kardexFiltrado = React.useMemo(() => {
    if (!Array.isArray(kardex)) return [];

    if (kardexDesde && kardexHasta && kardexDesde > kardexHasta) {
      return [];
    }

    const desde = kardexDesde || null;
    const hasta = kardexHasta || null;

    const filtrados = kardex.filter((m: any) => {
      const prodId = String(m.ProductoID ?? m.productoID ?? "");
      const bodId = String(m.BodegaID ?? m.bodegaID ?? "");

      if (kardexProductoId !== "all" && prodId !== kardexProductoId) {
        return false;
      }

      if (kardexBodegaId !== "all" && bodId !== kardexBodegaId) {
        return false;
      }

      const tipoRaw =
        m.TipoMovimiento ?? m.tipoMovimiento ?? m.Tipo ?? m.tipo ?? "";
      const t = String(tipoRaw).trim().toLowerCase();

      if (kardexTipo === "Entrada" && !t.startsWith("ent")) {
        return false;
      }

      if (kardexTipo === "Salida" && !t.startsWith("sal")) {
        return false;
      }

      if (desde || hasta) {
        const rawFecha =
          m.FechaMovimiento ??
          m.fechaMovimiento ??
          m.Fecha ??
          m.fecha ??
          m.FechaMov ??
          m.fechaMov;

        if (!rawFecha) return false;

        const date = new Date(rawFecha);
        if (Number.isNaN(date.getTime())) return false;

        const ymd = formatDateLocal(date);

        if (desde && ymd < desde) return false;
        if (hasta && ymd > hasta) return false;
      }

      return true;
    });

    const getFechaTs = (m: any) => {
      const rawFecha =
        m.FechaMovimiento ??
        m.fechaMovimiento ??
        m.Fecha ??
        m.fecha ??
        m.FechaMov ??
        m.fechaMov;

      const d = new Date(rawFecha);
      return Number.isNaN(d.getTime()) ? 0 : d.getTime();
    };

    filtrados.sort((a: any, b: any) => {
      const fa = getFechaTs(a);
      const fb = getFechaTs(b);
      if (fa !== fb) return fb - fa;

      const pa = String(
        a.NombreProducto ?? a.nombreProducto ?? a.Nombre ?? a.nombre ?? ""
      );
      const pb = String(
        b.NombreProducto ?? b.nombreProducto ?? b.Nombre ?? b.nombre ?? ""
      );

      const cmpProd = pa.localeCompare(pb);
      if (cmpProd !== 0) return cmpProd;

      const ta = String(
        a.TipoMovimiento ?? a.tipoMovimiento ?? a.Tipo ?? a.tipo ?? ""
      );
      const tb = String(
        b.TipoMovimiento ?? b.tipoMovimiento ?? b.Tipo ?? b.tipo ?? ""
      );

      return ta.localeCompare(tb);
    });

    return filtrados;
  }, [
    kardex,
    kardexProductoId,
    kardexBodegaId,
    kardexTipo,
    kardexDesde,
    kardexHasta,
  ]);

  const totalValorCosto = React.useMemo(
    () =>
      valorizacionPorBodega.reduce(
        (acc: number, x: any) => acc + Number(x.valorCosto ?? 0),
        0
      ),
    [valorizacionPorBodega]
  );

  const totalValorVenta = React.useMemo(
    () =>
      valorizacionPorBodega.reduce(
        (acc: number, x: any) => acc + Number(x.valorVenta ?? 0),
        0
      ),
    [valorizacionPorBodega]
  );

  const totalProductosDistintos = React.useMemo(() => {
    const ids = new Set(
      stockActual
        .map((x: any) => x.ProductoID ?? x.productoID)
        .filter((x: any) => x != null)
    );
    return ids.size;
  }, [stockActual]);

  const handleApplyCustomRange = () => {
    if (customDesde && customHasta && customDesde > customHasta) {
      setRangeValidationMessage(
        "La fecha desde no puede ser mayor que la fecha hasta."
      );
      return;
    }

    setRangeValidationMessage("");
    setAppliedCustom({
      desde: customDesde || undefined,
      hasta: customHasta || undefined,
    });
    setRange("custom");
  };

  React.useEffect(() => {
    if (kardexDesde && kardexHasta && kardexDesde > kardexHasta) {
      setKardexValidationMessage(
        "En Kardex, la fecha desde no puede ser mayor que la fecha hasta."
      );
      return;
    }

    setKardexValidationMessage("");
  }, [kardexDesde, kardexHasta]);

  if (rangeValidationMessage) {
    return (
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-amber-200 shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
        {rangeValidationMessage}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-200 shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
        Ocurrió un error al cargar el reporte de inventario: {error.message}
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#05070A] p-8 text-sm text-slate-300 shadow-[0_22px_60px_rgba(0,0,0,0.32)]">
        Cargando panel de inventario…
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className={`${panelClass} p-5 md:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full border border-[#f472b6]/25 bg-[#b1005f]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#f9a8d4]">
              Reportes · Inventario
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-wide text-slate-50">
                Panel de inventario
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Vista general del stock, valorización, movimientos, rotación y
                cobertura del inventario.
              </p>
            </div>

            {(data.fechaDesde ?? data.FechaDesde) &&
              (data.fechaHasta ?? data.FechaHasta) && (
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                  Rango:{" "}
                  <span className="ml-1 font-medium text-slate-100">
                    {formatShortDate(data.fechaDesde ?? data.FechaDesde ?? "")}
                  </span>
                  <span className="mx-1 text-slate-500">—</span>
                  <span className="font-medium text-slate-100">
                    {formatShortDate(data.fechaHasta ?? data.FechaHasta ?? "")}
                  </span>
                </div>
              )}
          </div>

          <div className="flex flex-col gap-4 md:items-end">
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className={pillClass(range === "30d")}
                onClick={() => {
                  setRangeValidationMessage("");
                  setRange("30d");
                }}
              >
                Últimos 30 días
              </button>
              <button
                type="button"
                className={pillClass(range === "90d")}
                onClick={() => {
                  setRangeValidationMessage("");
                  setRange("90d");
                }}
              >
                Últimos 90 días
              </button>
              <button
                type="button"
                className={pillClass(range === "year")}
                onClick={() => {
                  setRangeValidationMessage("");
                  setRange("year");
                }}
              >
                Este año
              </button>
              <button
                type="button"
                className={pillClass(range === "all")}
                onClick={() => {
                  setRangeValidationMessage("");
                  setRange("all");
                }}
              >
                Todo
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Rango específico
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-[#f472b6]/50"
                    value={customDesde}
                    onChange={(e) => setCustomDesde(e.target.value)}
                  />
                  <span className="text-slate-500">–</span>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-[#f472b6]/50"
                    value={customHasta}
                    onChange={(e) => setCustomHasta(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="mt-3 w-full rounded-xl bg-[#b1005f] px-3 py-2 text-xs font-semibold text-white shadow-[0_10px_28px_rgba(177,0,95,0.28)] transition hover:bg-[#990052]"
                  onClick={handleApplyCustomRange}
                >
                  Aplicar rango
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Producto
                </label>
                <select
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-[#f472b6]/50"
                  value={selectedProductoId}
                  onChange={(e) => setSelectedProductoId(e.target.value)}
                >
                  <option value="all">Todos</option>
                  {productosList.map((p, idx) => {
                    const id = p.ProductoID ?? p.productoID ?? p.id ?? idx;
                    return (
                      <option key={`prod-${id}-${idx}`} value={id}>
                        {(p.Nombre ?? p.nombre ?? "(Producto)") +
                          (p.SKU || p.Sku || p.sku
                            ? ` · ${p.SKU ?? p.Sku ?? p.sku}`
                            : "")}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Bodega
                </label>
                <select
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-[#f472b6]/50"
                  value={selectedBodegaId}
                  onChange={(e) => setSelectedBodegaId(e.target.value)}
                >
                  <option value="all">Todas</option>
                  {bodegasList.map((b, idx) => {
                    const id = b.BodegaID ?? b.bodegaID ?? b.Id ?? b.id ?? idx;
                    return (
                      <option key={`bod-${id}-${idx}`} value={id}>
                        {b.Nombre ?? b.nombre ?? "Bodega"}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className={`${panelClass} p-5`}>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Productos distintos en stock
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-50">
            {formatNumber(totalProductosDistintos)}
          </p>
          <div className="mt-4 h-px w-full bg-white/10" />
          <p className="mt-3 text-xs text-slate-500">
            Conteo de productos con existencia registrada.
          </p>
        </div>

        <div className={`${panelClass} p-5`}>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Valor de inventario (costo)
          </p>
          <p className="mt-3 text-3xl font-semibold" style={{ color: ACCENT_SOFT }}>
            {formatCurrency(totalValorCosto)}
          </p>
          <div className="mt-4 h-px w-full bg-white/10" />
          <p className="mt-3 text-xs text-slate-500">
            Suma valorizada al costo de compra.
          </p>
        </div>

        <div className={`${panelClass} p-5`}>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Valor de inventario (precio venta)
          </p>
          <p className="mt-3 text-3xl font-semibold text-emerald-400">
            {formatCurrency(totalValorVenta)}
          </p>
          <div className="mt-4 h-px w-full bg-white/10" />
          <p className="mt-3 text-xs text-slate-500">
            Proyección basada en precio de venta actual.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className={`${panelClass} p-5`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className={sectionTitleClass}>Stock actual por producto y bodega</h2>

            <div className="flex flex-wrap gap-2">
              <select
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-[#f472b6]/50"
                value={stockProductoId}
                onChange={(e) => setStockProductoId(e.target.value)}
              >
                <option value="all">Todos los productos</option>
                {productosList.map((p, idx) => {
                  const id = p.ProductoID ?? p.productoID ?? p.id ?? idx;
                  return (
                    <option key={`stock-prod-${id}-${idx}`} value={id}>
                      {(p.Nombre ?? p.nombre ?? "(Producto)") +
                        (p.SKU || p.Sku || p.sku
                          ? ` · ${p.SKU ?? p.Sku ?? p.sku}`
                          : "")}
                    </option>
                  );
                })}
              </select>

              <select
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-[#f472b6]/50"
                value={stockBodegaId}
                onChange={(e) => setStockBodegaId(e.target.value)}
              >
                <option value="all">Todas las bodegas</option>
                {bodegasList.map((b, idx) => {
                  const id = b.BodegaID ?? b.bodegaID ?? b.Id ?? b.id ?? idx;
                  return (
                    <option key={`stock-bod-${id}-${idx}`} value={id}>
                      {b.Nombre ?? b.nombre ?? "Bodega"}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="max-h-80 overflow-auto rounded-2xl border border-white/10 bg-black/10">
            {stockActualFiltrado.length === 0 ? (
              <p className="p-4 text-sm text-slate-400">
                No hay registros de inventario para los filtros seleccionados.
              </p>
            ) : (
              <table className="min-w-full border-collapse text-xs">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className="px-3 py-3 text-left font-medium">Producto</th>
                    <th className="px-3 py-3 text-left font-medium">SKU</th>
                    <th className="px-3 py-3 text-left font-medium">Bodega</th>
                    <th className="px-3 py-3 text-right font-medium">Existencia</th>
                    <th className="px-3 py-3 text-right font-medium">Disponible</th>
                    <th className="px-3 py-3 text-right font-medium">Valor costo</th>
                  </tr>
                </thead>
                <tbody>
                  {stockActualFiltrado.map((r: any, idx: number) => (
                    <tr
                      key={`stock-${r.ProductoID ?? r.productoID}-${r.BodegaID ?? r.bodegaID}-${idx}`}
                      className="border-t border-white/5 transition hover:bg-white/[0.03]"
                    >
                      <td className="px-3 py-3">
                        <span className="font-medium text-slate-100">
                          {r.NombreProducto ??
                            r.nombreProducto ??
                            r.Nombre ??
                            r.nombre ??
                            "(Producto)"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-300">
                        {r.Sku ?? r.SKU ?? r.sku ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-300">
                        {r.NombreBodega ??
                          r.nombreBodega ??
                          r.Bodega ??
                          r.bodega ??
                          "—"}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-100">
                        {formatNumber(
                          r.Cantidad ??
                            r.cantidad ??
                            r.Existencia ??
                            r.existencia ??
                            r.StockTotal ??
                            r.stockTotal ??
                            r.StockActual ??
                            r.stockActual ??
                            0
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-100">
                        {formatNumber(
                          r.Disponible ??
                            r.disponible ??
                            r.StockDisponible ??
                            r.stockDisponible ??
                            ((r.Cantidad ??
                              r.cantidad ??
                              r.Existencia ??
                              r.existencia ??
                              r.StockTotal ??
                              r.stockTotal ??
                              r.StockActual ??
                              r.stockActual ??
                              0) -
                              (r.CantidadReservada ??
                                r.cantidadReservada ??
                                r.Reservada ??
                                r.reservada ??
                                0))
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-slate-100">
                        {formatCurrency(
                          r.ValorCosto ??
                            r.valorCosto ??
                            (r.PrecioCosto ?? r.precioCosto ?? 0) *
                              (r.Cantidad ??
                                r.cantidad ??
                                r.Existencia ??
                                r.existencia ??
                                r.StockTotal ??
                                r.stockTotal ??
                                r.StockActual ??
                                r.stockActual ??
                                0)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className={`${panelClass} p-5`}>
          <h2 className={`mb-4 ${sectionTitleClass}`}>
            Productos sin stock / stock crítico
          </h2>
          <div className="max-h-80 space-y-3 overflow-auto pr-1">
            {productosCriticosAgrupados.length === 0 ? (
              <p className="text-sm text-slate-400">
                No se detectaron productos sin stock o en nivel crítico.
              </p>
            ) : (
              productosCriticosAgrupados.map((p: any, idx: number) => {
                const disponible = p.disponible ?? 0;
                const umbral = p.umbral ?? 0;
                const tipo =
                  disponible <= 0
                    ? "Sin stock"
                    : umbral > 0 && disponible <= umbral
                    ? "Crítico"
                    : "Bajo";

                return (
                  <div
                    key={`${p.ProductoID}-${idx}`}
                    className="flex items-center justify-between rounded-2xl border border-red-500/10 bg-red-500/[0.05] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        {p.Nombre ?? "(Producto)"}{" "}
                        {p.SKU && (
                          <span className="text-[11px] text-slate-400">
                            · {p.SKU}
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-300">
                        Disponible:{" "}
                        <span className="font-semibold">
                          {formatNumber(disponible)}
                        </span>{" "}
                        {umbral > 0 && (
                          <>
                            · Umbral:{" "}
                            <span className="font-semibold">
                              {formatNumber(umbral)}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <span className="rounded-full border border-red-400/20 bg-red-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-200">
                      {tipo}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className={`${panelClass} p-5`}>
          <h2 className={`mb-4 ${sectionTitleClass}`}>
            Valorización de inventario (por bodega)
          </h2>
          <div className="max-h-72 space-y-3 overflow-auto pr-1">
            {valorizacionPorBodega.length === 0 ? (
              <p className="text-sm text-slate-400">
                No hay datos de valorización para el rango seleccionado.
              </p>
            ) : (
              valorizacionPorBodega.map((v: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.06]"
                >
                  <p className="text-sm font-medium text-slate-100">
                    {v.NombreBodega ?? "Total"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Costo:{" "}
                    <span className="font-semibold text-slate-100">
                      {formatCurrency(v.valorCosto ?? 0)}
                    </span>{" "}
                    · Venta:{" "}
                    <span className="font-semibold text-emerald-300">
                      {formatCurrency(v.valorVenta ?? 0)}
                    </span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`${panelClass} p-5`}>
          <h2 className={`mb-4 ${sectionTitleClass}`}>
            Resumen de movimientos por tipo
          </h2>
          <div className="h-64 rounded-2xl border border-white/10 bg-black/10 p-3">
            {resumenMovimientosChart.length === 0 ? (
              <p className="text-xs text-slate-400">
                No hay movimientos de inventario en el periodo.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={resumenMovimientosChart}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#4B5563"
                    strokeOpacity={0.35}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="tipo"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(15,23,42,0.6)" }}
                    content={({ active, payload }: any) => {
                      if (!active || !payload || !payload.length) return null;

                      const item = payload[0]?.payload as any;
                      if (!item) return null;

                      return (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700 shadow-2xl">
                          <div className="font-semibold">
                            {item.tipo ?? "Movimiento"}
                          </div>
                          <div className="mt-1">
                            Cantidad total:{" "}
                            <span className="font-semibold">
                              {formatNumber(item.cantidad)}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cantidad"
                    stroke={ACCENT}
                    fill={ACCENT_SOFT}
                    fillOpacity={0.35}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className={`${panelClass} p-5`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className={sectionTitleClass}>Kardex / historial de movimientos</h2>

            <div className="flex flex-wrap gap-2">
              <select
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-[#f472b6]/50"
                value={kardexProductoId}
                onChange={(e) => setKardexProductoId(e.target.value)}
              >
                <option value="all">Todos los productos</option>
                {productosList.map((p, idx) => {
                  const id = p.ProductoID ?? p.productoID ?? p.id ?? idx;
                  return (
                    <option key={`kdx-prod-${id}-${idx}`} value={id}>
                      {(p.Nombre ?? p.nombre ?? "(Producto)") +
                        (p.SKU || p.Sku || p.sku
                          ? ` · ${p.SKU ?? p.Sku ?? p.sku}`
                          : "")}
                    </option>
                  );
                })}
              </select>

              <select
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-[#f472b6]/50"
                value={kardexBodegaId}
                onChange={(e) => setKardexBodegaId(e.target.value)}
              >
                <option value="all">Todas las bodegas</option>
                {bodegasList.map((b, idx) => {
                  const id = b.BodegaID ?? b.bodegaID ?? b.Id ?? b.id ?? idx;
                  return (
                    <option key={`kdx-bod-${id}-${idx}`} value={id}>
                      {b.Nombre ?? b.nombre ?? "Bodega"}
                    </option>
                  );
                })}
              </select>

              <select
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-[#f472b6]/50"
                value={kardexTipo}
                onChange={(e) =>
                  setKardexTipo(e.target.value as "all" | "Entrada" | "Salida")
                }
              >
                <option value="all">Todos los tipos</option>
                <option value="Entrada">Entradas</option>
                <option value="Salida">Salidas</option>
              </select>
            </div>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto] md:items-end">
            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Fecha desde
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-[#f472b6]/50"
                value={kardexDesde}
                onChange={(e) => setKardexDesde(e.target.value)}
              />
            </div>

            <div className="hidden text-center text-slate-500 md:block">—</div>

            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Fecha hasta
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-[#f472b6]/50"
                value={kardexHasta}
                onChange={(e) => setKardexHasta(e.target.value)}
              />
            </div>

            <div>
              {(kardexDesde || kardexHasta) && (
                <button
                  type="button"
                  className="w-full rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/[0.06]"
                  onClick={() => {
                    setKardexDesde("");
                    setKardexHasta("");
                  }}
                >
                  Limpiar fecha
                </button>
              )}
            </div>
          </div>

          {kardexValidationMessage && (
            <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-200">
              {kardexValidationMessage}
            </div>
          )}

          <div className="max-h-80 overflow-auto rounded-2xl border border-white/10 bg-black/10">
            {kardexFiltrado.length === 0 ? (
              <p className="p-4 text-sm text-slate-400">
                No hay movimientos registrados para los filtros seleccionados.
              </p>
            ) : (
              <table className="min-w-full border-collapse text-xs">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className="px-3 py-3 text-left font-medium">Fecha</th>
                    <th className="px-3 py-3 text-left font-medium">Producto</th>
                    <th className="px-3 py-3 text-left font-medium">Bodega</th>
                    <th className="px-3 py-3 text-left font-medium">Tipo</th>
                    <th className="px-3 py-3 text-right font-medium">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {kardexFiltrado.map((m: any, idx: number) => (
                    <tr
                      key={idx}
                      className="border-t border-white/5 transition hover:bg-white/[0.03]"
                    >
                      <td className="px-3 py-3 text-slate-300">
                        {formatShortDate(
                          m.FechaMovimiento ??
                            m.fechaMovimiento ??
                            m.Fecha ??
                            m.fecha ??
                            m.FechaMov ??
                            m.fechaMov
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-medium text-slate-100">
                          {m.NombreProducto ??
                            m.nombreProducto ??
                            m.Nombre ??
                            m.nombre ??
                            "(Producto)"}
                        </span>
                        {(m.Sku || m.SKU || m.sku) && (
                          <span className="ml-1 text-[10px] text-slate-400">
                            · {m.Sku ?? m.SKU ?? m.sku}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-300">
                        {m.NombreBodega ??
                          m.nombreBodega ??
                          m.Bodega ??
                          m.bodega ??
                          "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-300">
                        {m.TipoMovimiento ??
                          m.tipoMovimiento ??
                          m.Tipo ??
                          m.tipo ??
                          "—"}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-slate-100">
                        {formatNumber(m.Cantidad ?? m.cantidad ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className={`${panelClass} p-5`}>
          <h2 className={`mb-4 ${sectionTitleClass}`}>
            Rotación de inventario por producto
          </h2>
          <div className="max-h-80 space-y-3 overflow-auto pr-1">
            {rotacion.length === 0 ? (
              <p className="text-sm text-slate-400">
                No hay datos de rotación de inventario para el periodo.
              </p>
            ) : (
              rotacion.map((r: any, idx: number) => (
                <div
                  key={`${r.ProductoID ?? r.productoID}-${idx}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.06]"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {r.Nombre ??
                        r.nombre ??
                        r.NombreProducto ??
                        r.nombreProducto ??
                        "(Producto)"}{" "}
                      {(r.Sku || r.SKU || r.sku) && (
                        <span className="text-[11px] text-slate-400">
                          · {r.Sku ?? r.SKU ?? r.sku}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Vendido:{" "}
                      <span className="font-semibold text-slate-100">
                        {formatNumber(
                          r.CantidadVendida ??
                            r.cantidadVendida ??
                            r.CantidadVendidaPeriodo ??
                            r.cantidadVendidaPeriodo ??
                            0
                        )}
                      </span>{" "}
                      · Stock actual:{" "}
                      <span className="font-semibold text-slate-100">
                        {formatNumber(
                          r.StockActual ??
                            r.stockActual ??
                            r.Stock ??
                            r.stock ??
                            0
                        )}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Rotación
                    </p>
                    <p
                      className="mt-1 text-sm font-semibold"
                      style={{ color: ACCENT_SOFT }}
                    >
                      {Number(
                        r.IndiceRotacion ??
                          r.indiceRotacion ??
                          r.Rotacion ??
                          r.rotacion ??
                          0
                      ).toFixed(2)}{" "}
                      x
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className={`${panelClass} p-5`}>
          <h2 className={`mb-4 ${sectionTitleClass}`}>
            Productos sin movimiento (inventario)
          </h2>
          <div className="max-h-80 space-y-3 overflow-auto pr-1">
            {productosSinMovimiento.length === 0 ? (
              <p className="text-sm text-slate-400">
                Todos los productos activos tienen algún movimiento en el
                periodo.
              </p>
            ) : (
              productosSinMovimiento.map((p: any, idx: number) => (
                <div
                  key={`${p.ProductoID ?? p.productoID}-${idx}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.06]"
                >
                  <p className="text-sm font-medium text-slate-100">
                    {p.Nombre ??
                      p.nombre ??
                      p.NombreProducto ??
                      p.nombreProducto ??
                      "(Producto)"}{" "}
                    {(p.Sku || p.SKU || p.sku) && (
                      <span className="text-[11px] text-slate-400">
                        · {p.Sku ?? p.SKU ?? p.sku}
                      </span>
                    )}
                  </p>
                  {(p.CreatedAt ||
                    p.createdAt ||
                    p.FechaCreacion ||
                    p.fechaCreacion) && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Creado:{" "}
                      {formatShortDate(
                        p.CreatedAt ??
                          p.createdAt ??
                          p.FechaCreacion ??
                          p.fechaCreacion
                      )}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`${panelClass} p-5`}>
          <h2 className={`mb-4 ${sectionTitleClass}`}>
            Cobertura de inventario (días estimados)
          </h2>
          <div className="max-h-80 overflow-auto rounded-2xl border border-white/10 bg-black/10">
            {coberturaAgrupada.length === 0 ? (
              <p className="p-4 text-sm text-slate-400">
                No hay información de ventas suficiente para calcular cobertura
                de inventario.
              </p>
            ) : (
              <table className="min-w-full border-collapse text-xs">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className="px-3 py-3 text-left font-medium">Producto</th>
                    <th className="px-3 py-3 text-left font-medium">SKU</th>
                    <th className="px-3 py-3 text-right font-medium">
                      Stock disponible
                    </th>
                    <th className="px-3 py-3 text-right font-medium">
                      Venta diaria prom.
                    </th>
                    <th className="px-3 py-3 text-right font-medium">
                      Cobertura (días)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {coberturaAgrupada.map((c: any, idx: number) => (
                    <tr
                      key={idx}
                      className="border-t border-white/5 transition hover:bg-white/[0.03]"
                    >
                      <td className="px-3 py-3">
                        <span className="font-medium text-slate-100">
                          {c.Nombre ?? "(Producto)"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-300">
                        {c.SKU ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-100">
                        {formatNumber(c.stock ?? 0)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-100">
                        {formatNumber(c.ventaDiaria ?? 0)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span
                          className="font-semibold"
                          style={{ color: ACCENT_SOFT }}
                        >
                          {Number(c.diasCobertura ?? 0).toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default InventarioDashboardFragment;