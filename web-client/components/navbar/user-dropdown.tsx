import { Avatar, Dropdown, Navbar, Text } from "@nextui-org/react";
import React from "react";
import { DarkModeSwitch } from "./darkmodeswitch";
import { useRouter } from "next/router";
import { useSession } from "@/hooks/useSession";

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

  const onAction = async (actionKey: React.Key) => {
    switch (actionKey) {
      case "logout":
        try { await logout(); } finally { router.replace("/login"); }
        break;
      default:
        break;
    }
  };

  return (
    <Dropdown placement="bottom-right">
      <Navbar.Item aria-label="Menú de usuario">
        <Dropdown.Trigger>
          <Avatar
            bordered
            as="button"
            color="secondary"
            size="md"
            src={avatarSrc}
            text={!avatarSrc ? initials : undefined} 
          />
        </Dropdown.Trigger>
      </Navbar.Item>

      <Dropdown.Menu aria-label="Acciones de usuario" onAction={onAction}>
        <Dropdown.Item key="profile" css={{ height: "$18" }}>
          <Text b color="inherit" css={{ d: "flex" }}>
            {isAuthenticated ? "Conectado como" : "Invitado"}
          </Text>
          <Text b color="inherit" css={{ d: "flex" }}>
            {displayName}
          </Text>
        </Dropdown.Item>

        <Dropdown.Item key="settings" withDivider>
          Mis ajustes
        </Dropdown.Item>
        <Dropdown.Item key="team_settings">
          Ajustes del equipo
        </Dropdown.Item>
        <Dropdown.Item key="analytics" withDivider>
          Analítica
        </Dropdown.Item>
        <Dropdown.Item key="system">
          Sistema
        </Dropdown.Item>
        <Dropdown.Item key="configurations">
          Configuración
        </Dropdown.Item>
        <Dropdown.Item key="help_and_feedback" withDivider>
          Ayuda y comentarios
        </Dropdown.Item>

        <Dropdown.Item key="logout" withDivider color="error">
          Cerrar sesión
        </Dropdown.Item>

        <Dropdown.Item key="switch" withDivider>
          <DarkModeSwitch />
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};
