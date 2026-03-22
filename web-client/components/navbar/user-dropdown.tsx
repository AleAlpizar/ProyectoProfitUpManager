import React from "react";
import { Avatar, Button, Dropdown, Navbar, Text } from "@nextui-org/react";
import { useRouter } from "next/router";
import { useSession } from "../hooks/useSession";

const SURFACE = "#121618";
const SURFACE2 = "#1A2022";
const BORDER = "rgba(255,255,255,0.10)";
const TEXT = "#E6E9EA";
const MUTED = "#8B9AA0";
const MAGENTA = "#A30862";

export const UserDropdown: React.FC = () => {
  const router = useRouter();
  const { logout, me, isAuthenticated } = useSession();

  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const displayName =
    (me?.nombre
      ? `${me.nombre}${me?.apellido ? " " + me.apellido : ""}`
      : "") ||
    me?.correo ||
    "Invitado";

  const initials =
    ((me?.nombre?.[0] || "") + (me?.apellido?.[0] || "")).toUpperCase() ||
    (me?.correo?.[0]?.toUpperCase() ?? "?");

  const avatarSrc: string | undefined =
    (me as any)?.fotoUrl || (me as any)?.avatar || undefined;

  const onAction = async (key: React.Key) => {
    const action = String(key);

    if (!isAuthenticated && (action === "profile" || action === "logout")) {
      return;
    }

    switch (action) {
      case "profile":
        await router.push("/Perfil/perfil");
        break;
      case "logout":
        setShowLogoutConfirm(true);
        break;
      default:
        break;
    }
  };

  const closeLogoutConfirm = () => {
    if (isLoggingOut) return;
    setShowLogoutConfirm(false);
  };

  const confirmLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await logout();
      await router.replace("/login");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const menuItems: React.ReactElement[] = [
    <Dropdown.Item
      key="header"
      textValue="Información del usuario"
      css={{ py: "$6" }}
    >
      <div className="flex w-full items-center gap-3">
        <Avatar
          size="sm"
          src={avatarSrc}
          text={!avatarSrc ? initials : undefined}
          bordered
        />
        <div className="min-w-0">
          <Text
            size={"$xs"}
            css={{ color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em" }}
          >
            {isAuthenticated ? "Conectado como" : "Invitado"}
          </Text>
          <Text
            style={{
              fontWeight: 700,
              color: TEXT,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginTop: "4px",
            }}
            title={displayName}
          >
            {displayName}
          </Text>
        </div>
      </div>
    </Dropdown.Item>,
  ];

  if (isAuthenticated) {
    menuItems.push(
      <Dropdown.Item key="profile" textValue="Mi perfil" withDivider>
        Mi perfil
      </Dropdown.Item>
    );

    menuItems.push(
      <Dropdown.Item key="logout" textValue="Cerrar sesión" withDivider>
        <span style={{ color: MAGENTA, fontWeight: 700 }}>
          Cerrar sesión
        </span>
      </Dropdown.Item>
    );
  } else {
    menuItems.push(
      <Dropdown.Item
        key="login-info"
        textValue="Inicia sesión para continuar"
        withDivider
      >
        <span style={{ color: MUTED }}>Inicia sesión para continuar</span>
      </Dropdown.Item>
    );
  }

  return (
    <>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111418] p-6 text-white shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
            <h3 className="text-lg font-semibold tracking-[0.01em]">
              Cerrar sesión
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              ¿De verdad quieres cerrar la sesión?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeLogoutConfirm}
                disabled={isLoggingOut}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => void confirmLogout()}
                disabled={isLoggingOut}
                className="rounded-xl bg-[#ff4d4f] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? "Cerrando..." : "Sí, cerrar sesión"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar.Item aria-label="Menú de usuario" title="Menú de usuario">
        <Dropdown placement="bottom-right">
          <Dropdown.Trigger>
            <Button
              auto
              light
              css={{
                p: 0,
                minWidth: "auto",
                bg: "transparent",
              }}
              aria-label="Abrir menú de usuario"
            >
              <Avatar
                bordered
                color="secondary"
                size="md"
                src={avatarSrc}
                text={!avatarSrc ? initials : undefined}
              />
            </Button>
          </Dropdown.Trigger>

          <Dropdown.Menu
            aria-label="Acciones de usuario"
            onAction={onAction}
            css={{
              "$$dropdownMenuWidth": "290px",
              "$$dropdownItemHeight": "auto",
              bg: SURFACE,
              border: `1px solid ${BORDER}`,
              boxShadow: "0 20px 60px rgba(0,0,0,.45)",
              color: TEXT,
              overflow: "hidden",
              br: "22px",
              p: "$2",
              "& .nextui-dropdown-section-title": { color: MUTED },
              "& .nextui-dropdown-item": {
                py: "$4",
                px: "$4",
                bg: "transparent",
                borderRadius: "16px",
                "& .nextui-dropdown-item-content": {
                  color: TEXT,
                  backgroundColor: "transparent",
                },
                "&:hover, &:focus, &:active": {
                  bg: SURFACE2,
                },
              },
              "& .nextui-dropdown-item--with-divider": {
                borderTop: `1px solid ${BORDER}`,
              },
            }}
          >
            {menuItems}
          </Dropdown.Menu>
        </Dropdown>
      </Navbar.Item>
    </>
  );
};