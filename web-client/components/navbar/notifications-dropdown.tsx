import React from "react";
import { Dropdown, Navbar, Text, Badge, Button } from "@nextui-org/react";
import { NotificationIcon } from "../icons/navbar/notificationicon";

type NotificationItem = {
  id: string | number;
  title: string;
  description?: string;
  time?: string; 
  unread?: boolean;
};

type Props = {
  items?: NotificationItem[];
  onMarkAllRead?: () => void;
};

const SURFACE = "#121618";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT = "#E6E9EA";
const MUTED = "#8B9AA0";
const MAGENTA = "#A30862";
const LIMA = "#95B64F";

export const NotificationsDropdown: React.FC<Props> = ({
  items = [
    {
      id: 1,
      title: "Edita tu información",
      description: "Actualiza tus datos de perfil para mantener tu cuenta al día.",
      time: "hace 10 min",
      unread: true,
    },
    {
      id: 2,
      title: "¡Di adiós a los recibos en papel!",
      description: "Activa los recibos digitales en tu configuración.",
      time: "hace 1 h",
    },
    {
      id: 3,
      title: "Recordatorio semanal",
      description: "Revisa las métricas de esta semana.",
      time: "ayer",
    },
  ],
  onMarkAllRead,
}) => {
  const unreadCount = items.filter((i) => i.unread).length;

  const renderMenuItems = (): React.ReactElement[] => {
    const elements: React.ReactElement[] = [];

    elements.push(
      <Dropdown.Item key="header" css={{ py: "$2" }}>
        <div className="flex w-full items-center justify-between">
          <Text size={"$xs"} css={{ color: MUTED }}>
            {unreadCount > 0 ? `${unreadCount} sin leer` : "Estás al día"}
          </Text>
          <button
            type="button"
            onClick={() => onMarkAllRead?.()}
            className="text-xs underline underline-offset-2 hover:opacity-90"
            style={{ color: unreadCount > 0 ? MAGENTA : MUTED }}
          >
            {unreadCount > 0 ? "Marcar todo como leído" : "Refrescar"}
          </button>
        </div>
      </Dropdown.Item>
    );

    if (items.length === 0) {
      elements.push(
        <Dropdown.Item key="empty" css={{ py: "$8" }}>
          <Text css={{ color: MUTED, textAlign: "center", w: "100%" }}>
            No tienes notificaciones.
          </Text>
        </Dropdown.Item>
      );
      return elements;
    }
    elements.push(
      ...items.map((n) => (
        <Dropdown.Item key={n.id} showFullDescription>
          <div className="flex w-full items-start gap-3">
            <span
              className="mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ background: n.unread ? MAGENTA : BORDER }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Text style={{ fontWeight: 600, color: TEXT }}>{n.title}</Text>
                {n.unread ? (
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
                ) : null}
              </div>

              {n.description ? (
                <Text
                  size={"$xs"}
                  css={{ color: MUTED, mt: "$1", lineHeight: 1.4 }}
                >
                  {n.description}
                </Text>
              ) : null}

              {n.time ? (
                <Text size={"$xs"} css={{ color: MUTED, mt: "$2" }}>
                  {n.time}
                </Text>
              ) : null}
            </div>
          </div>
        </Dropdown.Item>
      ))
    );

    return elements;
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
            <div className="relative">
              <NotificationIcon />
              {unreadCount > 0 ? (
                <span
                  aria-hidden
                  className="absolute -right-0.5 -top-0.5 inline-block h-2.5 w-2.5 rounded-full"
                  style={{
                    background: MAGENTA,
                    boxShadow: `0 0 0 2px ${SURFACE}`,
                  }}
                />
              ) : null}
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
              py: "$5",
              alignItems: "flex-start",
              "&:hover": { bg: "rgba(255,255,255,0.04)" },
              "& .nextui-dropdown-item-content": { w: "100%", gap: "$2" },
            },
          }}
        >
          <Dropdown.Section title="Notificaciones">
            {renderMenuItems()}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown>
    </Navbar.Item>
  );
};
