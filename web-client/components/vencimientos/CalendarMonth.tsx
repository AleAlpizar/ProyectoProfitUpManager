"use client";
import * as React from "react";
import { useCalendar } from "./useCalendar";
import type { CalEvent, CalEstado } from "./calendar.types";

const WINE = "#A30862";

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function labelEstado(e: CalEstado) {
  return e === "VENCIDO" ? "Vencido" : e === "PROXIMO" ? "Próximo" : "Vigente";
}

function chipClasses(e: CalEstado) {
  if (e === "VENCIDO")  return "bg-red-400/20 text-red-300 ring-1 ring-red-400/30";
  if (e === "PROXIMO")  return "bg-yellow-400/20 text-yellow-300 ring-1 ring-yellow-400/30";
  return "bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/30";
}

function toLocalISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type Props = {
  onEdit: (id: number) => void;
  onCreate: (dateISO: string) => void;
};

export default function CalendarMonth({ onEdit, onCreate }: Props) {
  const {
    data, loading, error,
    current, setToday, nextMonth, prevMonth,
    from, to,
    soloPendientes, setSoloPendientes,
    tipo, setTipo,
    reload,
  } = useCalendar(true); 

  React.useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      select.dark-select option { background: #0b0e10; color: #e6e9ea; }
      select.dark-select:focus { outline: none; box-shadow: 0 0 0 2px ${WINE}40; border-color: ${WINE}66; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const filteredByTipo = React.useMemo<CalEvent[]>(
    () => (tipo ? data.filter(ev => ev.tipoNombre === tipo) : data),
    [data, tipo]
  );

  const groups = React.useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    filteredByTipo.forEach(ev => {
      const key = ev.fechaVencimiento.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    });
    return map;
  }, [filteredByTipo]);

  const days: Date[] = React.useMemo(() => {
    const arr: Date[] = [];
    const cur = new Date(from);
    cur.setHours(0,0,0,0);
    const end = new Date(to);
    end.setHours(0,0,0,0);
    while (cur <= end) {
      arr.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  }, [from, to]);

  const monthLabel = React.useMemo(
    () => current.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    [current]
  );

  const tipos = React.useMemo(() => {
    const s = new Set<string>();
    data.forEach(ev => s.add(ev.tipoNombre));
    return Array.from(s).sort();
  }, [data]);

  const [dayOpen, setDayOpen] = React.useState<{ open: boolean; date?: Date; items?: CalEvent[] }>({ open: false });

  const keyOf = (d: Date) => toLocalISO(d);
  const openDay = (d: Date) => setDayOpen({ open: true, date: d, items: groups.get(keyOf(d)) ?? [] });
  const closeDay = () => setDayOpen({ open: false });

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeDay(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121618] text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 focus:outline-none focus:ring-2"
            style={{ boxShadow: "none" }}
            aria-label="Mes anterior"
            title="Mes anterior"
          >
            ←
          </button>
          <div className="rounded-xl border border-white/10 px-3 py-1.5 text-sm font-semibold">
            {monthLabel}
          </div>
          <button
            onClick={nextMonth}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 focus:outline-none focus:ring-2"
            aria-label="Mes siguiente"
            title="Mes siguiente"
          >
            →
          </button>
          <button
            onClick={setToday}
            className="ml-2 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 focus:outline-none focus:ring-2"
            style={{ borderColor: `${WINE}66` }}
          >
            Hoy
          </button>
          <button
            onClick={reload}
            className="ml-2 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 focus:outline-none focus:ring-2"
            style={{ borderColor: `${WINE}66` }}
          >
            Refrescar
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-white/80" title="Muestra solo próximos/vencidos">
            <input type="checkbox" checked={soloPendientes} onChange={(e) => (setSoloPendientes(e.target.checked))} />
            <span>Solo pendientes (próximos / vencidos)</span>
          </label>

          <div className="relative">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="dark-select appearance-none rounded-xl border border-white/10 bg-[#0f1214] px-3 py-2 pr-9 text-sm text-white outline-none focus:border-[#A30862]/40 focus:ring-2 focus:ring-[#A30862]/40"
              title="Filtrar por tipo"
            >
              <option value="" className="text-black">Todos los tipos</option>
              {tipos.map(t => (
                <option key={t} value={t} className="text-black">{t}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/60">▾</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto px-4 py-3">
        <TipoPill label="Todos" active={!tipo} onClick={() => setTipo("")} />
        {tipos.map(t => (
          <TipoPill key={t} label={t} active={tipo === t} onClick={() => setTipo(t)} />
        ))}
      </div>

      <div className="px-4 pb-4">
        <div className="grid grid-cols-7 gap-2 pt-2 text-xs text-white/60">
          {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d => (
            <div key={d} className="px-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((d) => {
            const key = keyOf(d);
            const items = groups.get(key) ?? [];
            const isThisMonth = d.getMonth() === current.getMonth();
            const isToday = sameDay(d, new Date());
            const iso = keyOf(d);

            return (
              <div
                key={key}
                className={classNames(
                  "group relative min-h-[108px] rounded-xl border p-2 text-left transition",
                  isThisMonth ? "bg-white/5 border-white/10" : "bg-transparent border-white/5 text-white/40",
                  "hover:bg-white/10 hover:border-white/15"
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => openDay(d)}
                    className="text-left text-xs"
                    title="Ver vencimientos del día"
                  >
                    {d.getDate()}
                  </button>

                  <button
                    onClick={() => onCreate(iso)}
                    className="invisible rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-xs text-white/90 transition group-hover:visible hover:bg-white/20"
                    title="Registrar aquí"
                    style={{ borderColor: `${WINE}66` }}
                  >
                    +
                  </button>

                  {isToday && (
                    <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white/90">Hoy</span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  {items.slice(0,3).map(ev => (
                    <button
                      key={ev.documentoVencimientoID}
                      onClick={() => onEdit(ev.documentoVencimientoID)}
                      className={classNames("truncate rounded-md px-2 py-1 text-[11px] ring-1 text-left", chipClasses(ev.estado))}
                      title={`${ev.titulo} • ${ev.tipoNombre} • ${ev.fechaVencimiento.slice(0,10)}${ev.descripcion ? " • " + ev.descripcion : ""}`}
                    >
                      {ev.titulo}
                    </button>
                  ))}
                  {items.length > 3 && (
                    <button
                      onClick={() => openDay(d)}
                      className="text-left text-[11px] text-white/70 hover:underline"
                      title="Ver todos"
                    >
                      +{items.length - 3} más
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {loading && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            Cargando calendario…
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        )}
      </div>

      {dayOpen.open && (
        <div
          className="fixed inset-0 z-[1200] flex items-end bg-black/60"
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeDay(); }}
        >
          <div className="w-full rounded-t-2xl border border-white/10 bg-[#0f1214] p-4 text-white shadow-2xl max-h-[85vh] overflow-auto">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold">
                {dayOpen.date?.toLocaleDateString(undefined, { weekday: "long", year:"numeric", month:"long", day:"numeric" })}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                  onClick={() => {
                    if (!dayOpen.date) return;
                    onCreate(toLocalISO(dayOpen.date));
                    closeDay();
                  }}
                  style={{ borderColor: `${WINE}66` }}
                >
                  Registrar aquí
                </button>
                <button
                  className="rounded-full px-2 text-white/80 hover:bg-white/10"
                  onClick={closeDay}
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>
            </div>

            {(!dayOpen.items || dayOpen.items.length === 0) ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Sin vencimientos este día.
              </div>
            ) : (
              <ul className="space-y-2">
                {dayOpen.items!.map(ev => (
                  <li key={`${ev.documentoVencimientoID}-${ev.titulo}`} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{ev.titulo}</div>
                      <div className="truncate text-xs text-white/70">{ev.tipoNombre} • {ev.fechaVencimiento.slice(0,10)}</div>
                      {ev.descripcion && (
                        <div
                          className="mt-1 text-xs text-white/80 whitespace-pre-wrap break-words"
                          style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                        >
                          {ev.descripcion}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={classNames("rounded-full px-2 py-0.5 text-[11px] ring-1", chipClasses(ev.estado))}>
                        {labelEstado(ev.estado)}
                      </span>
                      <button
                        onClick={() => onEdit(ev.documentoVencimientoID)}
                        className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                        style={{ borderColor: `${WINE}66` }}
                      >
                        Editar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TipoPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "whitespace-nowrap rounded-full px-3 py-1 text-xs ring-1 transition",
        active
          ? "text-white"
          : "text-white/80 hover:bg-white/10",
        active ? "bg-[#A30862]/20 ring-[#A30862]/40" : "bg-white/5 ring-white/15"
      )}
      title={`Filtrar: ${label}`}
    >
      {label}
    </button>
  );
}
