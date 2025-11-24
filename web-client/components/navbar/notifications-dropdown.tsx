"use client";

import React from "react";
import { Dropdown, Navbar, Text, Badge, Button } from "@nextui-org/react";

export type NotificationItem = {
  id: string | number;
  title: string;
  description?: string;
  time?: string;
  unread?: boolean;
};

type Props = {
  items?: NotificationItem[];
  loading?: boolean;
  error?: string;
  onMarkAllRead?: () => void;
  onRefresh?: () => void;
  onMarkRead?: (id: string | number) => void;
  onDismiss?: (id: string | number) => void;
};

const SURFACE = "#121618";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT = "#E6E9EA";
const MUTED = "#8B9AA0";
const MAGENTA = "#A30862";
const LIMA = "#95B64F";

const BellIcon: React.FC = () => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="text-[#E6E9EA]"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a5 5 0 0 0-5 5v2.8c0 .6-.2 1.1-.6 1.5L5 14.7c-.5.5-.2 1.3.4 1.3h12.2c.6 0 .9-.8.4-1.3l-1.4-1.4c-.4-.4-.6-.9-.6-1.5V8a5 5 0 0 0-5-5z" />
    <path d="M10 18a2 2 0 0 0 4 0" />
  </svg>
);

export const NotificationsDropdown: React.FC<Props> = ({
  items = [],
  loading = false,
  error,
  onMarkAllRead,
  onRefresh,
  onMarkRead,
  onDismiss,
}) => {
  const unreadCount = items.filter((i) => i.unread).length;

  const handleItemClick = (id: string | number) => {
    onMarkRead?.(id);
  };

  const handleDismiss = (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string | number
  ) => {
    e.stopPropagation();
    onDismiss?.(id);
  };

  const renderBody = (): React.ReactElement => {
    if (error) {
      return (
        <div className="py-4 text-center text-xs" style={{ color: "#fca5a5" }}>
          {error}
        </div>
      );
    }

    if (loading && items.length === 0) {
      return (
        <div className="py-6 text-center text-xs" style={{ color: MUTED }}>
          Cargando notificaciones…
        </div>
      );
    }

    if (!loading && items.length === 0) {
      return (
        <div className="py-8 text-center text-xs" style={{ color: MUTED }}>
          No tienes notificaciones.
        </div>
      );
    }

    return (
      <div className="max-h-[360px] space-y-2 overflow-y-auto">
        {items.map((n) => (
          <div
            key={n.id}
            className="flex w-full items-start gap-3 rounded-xl border px-3 py-2 text-left text-sm transition"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              backgroundColor: "#181d20",
            }}
            onClick={() => handleItemClick(n.id)}
          >
            <span
              className="mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ background: n.unread ? MAGENTA : BORDER }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <Text
                  size={"$sm"}
                  css={{
                    fontWeight: 600,
                    color: TEXT,
                    lineHeight: 1.3,
                  }}
                >
                  {n.title}
                </Text>
                {n.unread && (
                  <Badge
                    size="sm"
                    variant="flat"
                    css={{
                      bg: "rgba(149,182,79,.12)",
                      color: LIMA,
                      border: "1px solid rgba(149,182,79,.3)",
                    }}
                  >
                    Nuevo
                  </Badge>
                )}
                <button
                  type="button"
                  onClick={(e) => handleDismiss(e, n.id)}
                  className="ml-auto rounded-full px-1 text-xs text-white/60 hover:bg-white/10"
                  aria-label="Eliminar notificación"
                >
                  ×
                </button>
              </div>

              {n.description && (
                <Text
                  size={"$xs"}
                  css={{
                    color: MUTED,
                    mt: "$1",
                    lineHeight: 1.4,
                  }}
                >
                  {n.description}
                </Text>
              )}

              {n.time && (
                <Text size={"$xs"} css={{ color: MUTED, mt: "$2" }}>
                  {n.time}
                </Text>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Navbar.Item aria-label="Notificaciones" title="Notificaciones">
      <Dropdown placement="bottom-right">
        <Dropdown.Trigger>
          <Button
            auto
            light
            css={{ p: 0, minWidth: "auto" }}
            aria-label="Abrir notificaciones"
          >
            <div className="relative flex items-center justify-center">
              <BellIcon />
              {unreadCount > 0 && (
                <span
                  aria-hidden
                  className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full text-[11px] font-semibold"
                  style={{
                    backgroundColor: MAGENTA,
                    color: "#ffffff",
                    boxShadow: `0 0 0 2px ${SURFACE}`,
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
          </Button>
        </Dropdown.Trigger>

        <Dropdown.Menu
          aria-label="Notificaciones"
          css={{
            "$$dropdownMenuWidth": "360px",
            "$$dropdownItemHeight": "auto",
            bg: SURFACE,
            border: `1px solid ${BORDER}`,
            boxShadow: "0 20px 60px rgba(0,0,0,.45)",
            color: TEXT,
            "& .nextui-dropdown-item": {
              bg: "transparent",
              py: 0,
              pointerEvents: "none",
            },
            "& .nextui-dropdown-item-content": {
              w: "100%",
              gap: "$2",
            },
            "& .nextui-dropdown-item[aria-selected='true']": {
              bg: "transparent",
            },
          }}
        >
          <Dropdown.Section title="Notificaciones">
            <Dropdown.Item key="body" css={{ p: "$4" }}>
              <div
                className="w-full space-y-3"
                style={{ pointerEvents: "auto" }}
              >
                <div className="flex w-full items-center justify-between">
                  <Text size={"$xs"} css={{ color: MUTED }}>
                    {loading
                      ? "Cargando…"
                      : unreadCount > 0
                      ? `${unreadCount} sin leer`
                      : "Estás al día"}
                  </Text>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onRefresh?.()}
                      className="text-xs underline underline-offset-2 hover:opacity-90"
                      style={{ color: MUTED }}
                    >
                      Refrescar
                    </button>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => onMarkAllRead?.()}
                        className="text-xs underline underline-offset-2 hover:opacity-90"
                        style={{ color: MAGENTA }}
                      >
                        Marcar todo como leído
                      </button>
                    )}
                  </div>
                </div>

                {renderBody()}
              </div>
            </Dropdown.Item>
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown>
    </Navbar.Item>
  );
};
