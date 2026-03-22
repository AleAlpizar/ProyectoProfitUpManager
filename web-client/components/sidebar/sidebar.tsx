import React from "react";
import { useRouter } from "next/router";
import { useSidebarContext } from "../layout/layout-context";
import { useSession } from "../hooks/useSession";

import { CompaniesDropdown } from "../sidebar/companies-dropdown";
import { SidebarItem } from "../sidebar/sidebar-item";

import { HomeIcon } from "../icons/sidebar/home-icon";
import { PaymentsIcon } from "../icons/sidebar/payments-icon";
import { AccountsIcon } from "../icons/sidebar/accounts-icon";
import { CustomersIcon } from "../icons/sidebar/customers-icon";
import { ProductsIcon } from "../icons/sidebar/products-icon";
import { ReportsIcon } from "../icons/sidebar/reports-icon";

function normalizeRole(value: unknown): string {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

const Sidebar: React.FC = () => {
  const router = useRouter();
  const { collapsed, setCollapsed } = useSidebarContext();
  const { logout, me, isAuthenticated } = useSession();

  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const rawRole: string =
    (me as any)?.rolNombre ||
    (me as any)?.rol?.nombre ||
    (me as any)?.rol ||
    "";

  const normalizedRole = normalizeRole(rawRole);

  const isAdmin = normalizedRole === "ADMINISTRADOR";
  const isSeller =
    normalizedRole === "VENDEDOR" || normalizedRole === "EMPLEADO";

  const isGuest = !isAuthenticated || (!isAdmin && !isSeller);

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

  const roleLabel = rawRole?.trim() || "Invitado";

  const openLogoutConfirm = () => {
    if (!isAuthenticated || isLoggingOut) return;
    setShowLogoutConfirm(true);
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

  return (
    <>
      {collapsed && (
        <div
          onClick={setCollapsed}
          aria-hidden="true"
          className="fixed inset-0 z-[201] bg-black/50 backdrop-blur-[1px] md:hidden"
        />
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/60 px-4 backdrop-blur-[2px]">
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

      <aside
        className={[
          "fixed inset-y-0 left-0 z-[202] w-64 flex-shrink-0",
          "bg-neutral-950 border-r border-white/10 text-gray-200",
          "overflow-hidden",
          "transform transition-transform duration-200 ease-out",
          collapsed ? "translate-x-0" : "-translate-x-full",
          "md:sticky md:top-0 md:h-screen md:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-full min-h-0 flex-col bg-neutral-950">
          <div className="shrink-0 px-6 pb-5 pt-10">
            <div className="flex items-center gap-4 px-4">
              <CompaniesDropdown />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <nav
              className="flex-1 overflow-y-auto px-2 pb-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Navegación principal"
            >
              <div className="flex flex-col gap-2 px-2">
                {isAdmin && (
                  <>
                    <SidebarItem
                      title="Inicio"
                      icon={<HomeIcon />}
                      isActive={router.pathname === "/"}
                      href="/"
                      onClickItem={setCollapsed}
                    />

                    <SidebarItem
                      title="Administración"
                      icon={<AccountsIcon />}
                      isActive={router.pathname === "/accounts"}
                      href="/accounts"
                      onClickItem={setCollapsed}
                    />

                    <SidebarItem
                      title="Clientes"
                      icon={<CustomersIcon />}
                      isActive={router.pathname === "/customers"}
                      href="/customers"
                      onClickItem={setCollapsed}
                    />

                    <SidebarItem
                      title="Proveedores"
                      icon={<AccountsIcon />}
                      isActive={router.pathname === "/providers"}
                      href="/providers"
                      onClickItem={setCollapsed}
                    />

                    <SidebarItem
                      title="Operaciones"
                      icon={<PaymentsIcon />}
                      isActive={router.pathname.startsWith("/compras")}
                      href="/compras"
                      onClickItem={setCollapsed}
                    />

                    <SidebarItem
                      title="Ventas"
                      icon={<PaymentsIcon />}
                      isActive={router.pathname.startsWith("/ventas")}
                      href="/ventas"
                      onClickItem={setCollapsed}
                    />

                    <SidebarItem
                      title="Inventario"
                      icon={<ProductsIcon />}
                      isActive={router.pathname.startsWith("/inventario")}
                      href="/inventario/inventario"
                      onClickItem={setCollapsed}
                    />

                    <SidebarItem
                      title="Reportes"
                      icon={<ReportsIcon />}
                      isActive={router.pathname.startsWith("/reportes")}
                      href="/reportes"
                      onClickItem={setCollapsed}
                    />

                    <SidebarItem
                      title="Vencimientos"
                      icon={<ReportsIcon />}
                      isActive={router.pathname.startsWith("/vencimientos")}
                      href="/vencimientos/gestionar"
                      onClickItem={setCollapsed}
                    />
                  </>
                )}

                {isSeller && !isAdmin && (
                  <>
                    <SidebarItem
                      title="Clientes"
                      icon={<CustomersIcon />}
                      isActive={router.pathname === "/customers"}
                      href="/customers"
                      onClickItem={setCollapsed}
                    />

                    <SidebarItem
                      title="Registrar venta"
                      icon={<PaymentsIcon />}
                      isActive={router.pathname === "/ventas/registrar"}
                      href="/ventas/registrar"
                      onClickItem={setCollapsed}
                    />

                    <SidebarItem
                      title="Inventario"
                      icon={<ProductsIcon />}
                      isActive={router.pathname.startsWith("/inventario")}
                      href="/inventario/inventario"
                      onClickItem={setCollapsed}
                    />
                  </>
                )}

                {isGuest && (
                  <p className="px-2 text-xs text-gray-500">
                    Debes iniciar sesión para ver los módulos.
                  </p>
                )}
              </div>
            </nav>

            <div className="shrink-0 border-t border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] px-4 py-4">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-3 py-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="min-w-0 flex flex-1 items-center gap-3 text-left disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={() => {
                      if (isAuthenticated) {
                        void router.push("/Perfil/perfil");
                      }
                    }}
                    disabled={!isAuthenticated}
                    aria-label={
                      isAuthenticated
                        ? "Abrir perfil de usuario"
                        : "Perfil no disponible"
                    }
                  >
                    <div className="inline-grid h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10 bg-neutral-800 text-xs font-semibold text-gray-100 place-items-center shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[15px] font-semibold text-gray-100 leading-5 break-words"
                        title={displayName}
                      >
                        {displayName}
                      </div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.08em] text-gray-400 truncate">
                        {roleLabel}
                      </div>
                    </div>
                  </button>

                  {isAuthenticated && (
                    <button
                      onClick={openLogoutConfirm}
                      className="shrink-0 rounded-xl bg-red-500 px-3.5 py-2 text-xs font-medium text-white shadow-[0_10px_24px_rgba(255,77,79,0.22)] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                      title="Cerrar sesión"
                      type="button"
                      disabled={isLoggingOut}
                    >
                      Salir
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;