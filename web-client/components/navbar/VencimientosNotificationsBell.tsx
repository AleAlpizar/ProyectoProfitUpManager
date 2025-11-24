"use client";

import React from "react";
import { useAlertas } from "@/components/vencimientos/useVencimientos";
import type { AlertRowDto } from "@/components/vencimientos/types";
import { NotificationsDropdown, NotificationItem } from "./notifications-dropdown";

const READ_KEY = "venc_notifs_read_v1";
const DISMISSED_KEY = "venc_notifs_dismissed_v1";

function fmtISO(dateISO: string) {
  try {
    const d = new Date(dateISO);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  } catch {
    return dateISO;
  }
}

function daysToText(days: number) {
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence en 1 día";
  if (days > 1) return `Vence en ${days} días`;

  const abs = Math.abs(days);
  if (abs === 1) return "Venció hace 1 día";
  return `Venció hace ${abs} días`;
}

function mapRowToNotification(r: AlertRowDto): NotificationItem {
  const baseTitle =
    r.estado === "VENCIDO"
      ? `Vencido: ${r.titulo}`
      : `Próximo vencimiento: ${r.titulo}`;

  const fecha = fmtISO(r.fechaVencimiento);
  const time = daysToText(r.daysToDue);

  const descParts: string[] = [];
  descParts.push(r.tipoNombre);
  descParts.push(`Vence el ${fecha}`);
  descParts.push(time);
  if (r.referencia) descParts.push(`Ref: ${r.referencia}`);

  return {
    id: r.documentoVencimientoID,
    title: baseTitle,
    description: descParts.join(" • "),
    time,
    unread: true,
  };
}

function loadIdSet(key: string): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as number[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveIdSet(key: string, set: Set<number>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(Array.from(set)));
}

const VencimientosNotificationsBell: React.FC = () => {
  const { data, loading, error, reload } = useAlertas(7);

  const [readIds, setReadIds] = React.useState<Set<number>>(() =>
    loadIdSet(READ_KEY)
  );
  const [dismissedIds, setDismissedIds] = React.useState<Set<number>>(() =>
    loadIdSet(DISMISSED_KEY)
  );

  React.useEffect(() => {
    if (!data || data.length === 0) return;
    const validIds = new Set(data.map((r) => r.documentoVencimientoID));

    const newRead = new Set(
      Array.from(readIds).filter((id) => validIds.has(id))
    );
    const newDismissed = new Set(
      Array.from(dismissedIds).filter((id) => validIds.has(id))
    );

    if (newRead.size !== readIds.size) {
      setReadIds(newRead);
      saveIdSet(READ_KEY, newRead);
    }
    if (newDismissed.size !== dismissedIds.size) {
      setDismissedIds(newDismissed);
      saveIdSet(DISMISSED_KEY, newDismissed);
    }
  }, [data]);

  const markAllRead = React.useCallback(() => {
    const all = new Set(
      (data ?? []).map((r) => r.documentoVencimientoID)
    );
    setReadIds(all);
    saveIdSet(READ_KEY, all);
  }, [data]);

  const markRead = React.useCallback(
    (id: string | number) => {
      const num = Number(id);
      if (Number.isNaN(num)) return;
      setReadIds((prev) => {
        if (prev.has(num)) return prev;
        const next = new Set(prev);
        next.add(num);
        saveIdSet(READ_KEY, next);
        return next;
      });
    },
    []
  );

  const dismiss = React.useCallback((id: string | number) => {
    const num = Number(id);
    if (Number.isNaN(num)) return;
    setDismissedIds((prev) => {
      if (prev.has(num)) return prev;
      const next = new Set(prev);
      next.add(num);
      saveIdSet(DISMISSED_KEY, next);
      return next;
    });
  }, []);

  const items: NotificationItem[] = React.useMemo(() => {
    const baseRows = (data ?? []).filter(
      (r) => !dismissedIds.has(r.documentoVencimientoID)
    );
    return baseRows.map((r) => {
      const n = mapRowToNotification(r);
      const isRead = readIds.has(r.documentoVencimientoID);
      return { ...n, unread: !isRead };
    });
  }, [data, readIds, dismissedIds]);

  React.useEffect(() => {
    const id = setInterval(() => {
      reload().catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [reload]);

  return (
    <NotificationsDropdown
      items={items}
      loading={loading}
      error={error ?? undefined}
      onMarkAllRead={markAllRead}
      onRefresh={reload}
      onMarkRead={markRead}
      onDismiss={dismiss}
    />
  );
};

export default VencimientosNotificationsBell;
