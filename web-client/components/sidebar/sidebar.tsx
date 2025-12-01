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

const Sidebar: React.FC = () => {
  const router = useRouter();
  const { collapsed, setCollapsed } = useSidebarContext();
  const { logout, me, isAuthenticated } = useSession();

  const rawRole: string =
    (me as any)?.rolNombre ||
    (me as any)?.rol?.nombre ||
    (me as any)?.rol ||
    "";

  const normalizedRole = rawRole.toUpperCase();

  const isAdmin = normalizedRole === "ADMINISTRADOR";
  const isSeller =
    normalizedRole === "VENDEDOR" ||
    normalizedRole === "EMPLEADO";

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

  const roleLabel = rawRole || "Invitado";

  const onLogout = async () => {
    const confirmed = window.confirm("¿Seguro que quieres cerrar sesión?");
    if (!confirmed) return;

    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  };

  return (
    <>
      {collapsed && (
        <div
          onClick={setCollapsed}
          className="fixed inset-0 z-[201] bg-black/50 backdrop-blur-[1px] md:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-[202] w-64 flex-shrink-0",
          "bg-neutral-950 border-r border-white/10 text-gray-200",
          "py-10 px-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          "transform transition-transform duration-200 ease-out",
          collapsed ? "translate-x-0" : "-translate-x-full",
          "md:static md:h-screen md:translate-x-0",
        ].join(" ")}
      >
        <div className="flex items-center gap-4 px-4">
          <CompaniesDropdown />
        </div>

        <div className="mt-8 flex h-[calc(100%-110px)] flex-col justify-between">
          <nav className="flex flex-col gap-2 px-2">
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
          </nav>

          <div className="mt-4 border-t border-white/10 px-4 pt-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className="flex items-center gap-3 text-left"
                onClick={() => {
                  if (isAuthenticated) {
                    router.push("/Perfil/perfil");
                  }
                }}
                disabled={!isAuthenticated}
              >
                <div className="inline-grid h-8 w-8 overflow-hidden rounded-full ring-1 ring-white/10 bg-neutral-800 text-xs font-medium text-gray-100 place-items-center">
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
                <div className="flex flex-col">
                  <span className="max-w-[130px] truncate text-sm font-medium text-gray-100">
                    {displayName}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {roleLabel}
                  </span>
                </div>
              </button>

              {isAuthenticated && (
                <button
                  onClick={onLogout}
                  className="ml-2 rounded-md bg-red-500 px-3 py-1 text-xs text-white transition hover:opacity-90"
                  title="Cerrar sesión"
                  type="button"
                >
                  Salir
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
