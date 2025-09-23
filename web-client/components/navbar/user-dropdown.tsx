import { Avatar, Dropdown, Navbar, Text } from "@nextui-org/react";
import React from "react";
import { DarkModeSwitch } from "./darkmodeswitch";
import { useRouter } from "next/router";
import { useSession } from "@/hooks/useSession";

export const UserDropdown = () => {
  const router = useRouter();
  const { logout, me, isAuthenticated } = useSession();

  const onAction = async (actionKey: React.Key) => {
    switch (actionKey) {
      case "logout":
        try {
          await logout();           
        } finally {
          router.replace("/login");  
        }
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
            src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
          />
        </Dropdown.Trigger>
      </Navbar.Item>

      <Dropdown.Menu
        aria-label="Acciones de usuario"
        onAction={onAction}
      >
        <Dropdown.Item key="profile" css={{ height: "$18" }}>
          <Text b color="inherit" css={{ d: "flex" }}>
            {isAuthenticated ? "Conectado como" : "Invitado"}
          </Text>
          <Text b color="inherit" css={{ d: "flex" }}>
            {me?.correo ?? "-"}
          </Text>
        </Dropdown.Item>

        <Dropdown.Item key="settings" withDivider>
          My Settings
        </Dropdown.Item>
        <Dropdown.Item key="team_settings">Team Settings</Dropdown.Item>
        <Dropdown.Item key="analytics" withDivider>
          Analytics
        </Dropdown.Item>
        <Dropdown.Item key="system">System</Dropdown.Item>
        <Dropdown.Item key="configurations">Configurations</Dropdown.Item>
        <Dropdown.Item key="help_and_feedback" withDivider>
          Help & Feedback
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
