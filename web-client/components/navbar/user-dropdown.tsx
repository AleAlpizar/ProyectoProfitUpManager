import React from "react";
import { Avatar, Dropdown, Navbar, Text } from "@nextui-org/react";
import { useRouter } from "next/router";
import { useSession } from "../hooks/useSession";

const SURFACE  = "#121618";
const SURFACE2 = "#1A2022";
const BORDER   = "rgba(255,255,255,0.10)";
const TEXT     = "#E6E9EA";
const MUTED    = "#8B9AA0";
const MAGENTA  = "#A30862";

export const UserDropdown: React.FC = () => {
  const router = useRouter();
  const { logout, me, isAuthenticated } = useSession();

  const displayName =
    (me?.nombre ? `${me.nombre}${me?.apellido ? " " + me.apellido : ""}` : "") ||
    me?.correo ||
    "Invitado";

  const initials =
    ((me?.nombre?.[0] || "") + (me?.apellido?.[0] || "")).toUpperCase() ||
    (me?.correo?.[0]?.toUpperCase() ?? "?");

  const avatarSrc: string | undefined =
    (me as any)?.fotoUrl || (me as any)?.avatar || undefined;

  const onAction = async (key: React.Key) => {
    switch (key) {
      case "profile":        router.push("/perfil"); break;
      case "settings":       router.push("/ajustes"); break;
      case "team_settings":  router.push("/equipo/ajustes"); break;
      case "analytics":      router.push("/analytics"); break;
      case "system":         router.push("/sistema"); break;
      case "configurations": router.push("/configuracion"); break;
      case "help_and_feedback": router.push("/ayuda"); break;
      case "logout":
        try { await logout(); } finally { router.replace("/login"); }
        break;
      default: break;
    }
  };

  return (
    <Dropdown placement="bottom-right">
      <Navbar.Item aria-label="Menú de usuario" title="Menú de usuario">
        <Dropdown.Trigger>
          <Avatar
            as="button"
            bordered
            color="secondary"
            size="md"
            src={avatarSrc}
            text={!avatarSrc ? initials : undefined}
          />
        </Dropdown.Trigger>
      </Navbar.Item>

      <Dropdown.Menu
        aria-label="Acciones de usuario"
        onAction={onAction}
        css={{
          "$$dropdownMenuWidth": "280px",
          "$$dropdownItemHeight": "auto",
          bg: SURFACE,
          border: `1px solid ${BORDER}`,
          boxShadow: "0 20px 60px rgba(0,0,0,.45)",
          color: TEXT,
          overflow: "hidden",
          "& .nextui-dropdown-section-title": { color: MUTED },
          "& .nextui-dropdown-item": {
            py: "$4",
            "& .nextui-dropdown-item-content": { color: TEXT },
            "&:hover": { bg: SURFACE2 }
          },
          "& .nextui-dropdown-item--with-divider": { borderTop: `1px solid ${BORDER}` }
        }}
      >
        <Dropdown.Item key="header" css={{ py: "$6" }}>
          <div className="flex w-full items-center gap-3">
            <Avatar size="sm" src={avatarSrc} text={!avatarSrc ? initials : undefined} bordered />
            <div className="min-w-0">
              <Text size={"$xs"} css={{ color: MUTED }}>
                {isAuthenticated ? "Conectado como" : "Invitado"}
              </Text>
              <Text
                style={{
                  fontWeight: 600,
                  color: TEXT,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
                title={displayName}
              >
                {displayName}
              </Text>
            </div>
          </div>
        </Dropdown.Item>

        <Dropdown.Item key="profile" withDivider>Mi perfil</Dropdown.Item>
        <Dropdown.Item key="settings">Mis ajustes</Dropdown.Item>
        <Dropdown.Item key="team_settings">Ajustes del equipo</Dropdown.Item>
        <Dropdown.Item key="analytics" withDivider>Analítica</Dropdown.Item>
        <Dropdown.Item key="system">Sistema</Dropdown.Item>
        <Dropdown.Item key="configurations">Configuración</Dropdown.Item>
        <Dropdown.Item key="help_and_feedback" withDivider>Ayuda y comentarios</Dropdown.Item>

        <Dropdown.Item key="logout" withDivider>
          <span style={{ color: MAGENTA, fontWeight: 600 }}>Cerrar sesión</span>
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};
