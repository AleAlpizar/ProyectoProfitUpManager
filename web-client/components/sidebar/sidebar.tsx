import React from "react";
import { useRouter } from "next/router";
import { useSidebarContext } from "../layout/layout-context";
import { useSession } from "@/hooks/useSession";

import { CompaniesDropdown } from "../sidebar/companies-dropdown";
import { SidebarItem } from "../sidebar/sidebar-item";

import { HomeIcon } from "../icons/sidebar/home-icon";
import { PaymentsIcon } from "../icons/sidebar/payments-icon";
import { AccountsIcon } from "../icons/sidebar/accounts-icon";
import { CustomersIcon } from "../icons/sidebar/customers-icon";
import { ProductsIcon } from "../icons/sidebar/products-icon";
import { ReportsIcon } from "../icons/sidebar/reports-icon";
import { SettingsIcon } from "../icons/sidebar/settings-icon";
import { ChangeLogIcon } from "../icons/sidebar/changelog-icon";

const Sidebar: React.FC = () => {
  const router = useRouter();
  const { collapsed, setCollapsed } = useSidebarContext();
  const { logout } = useSession();

  const onLogout = async () => {
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
              title="Operaciones"
              icon={<PaymentsIcon />}
              isActive={
                router.pathname.startsWith("/compras") ||
                router.pathname.startsWith("/ventas")
              }
              href="/compras/ordenes"
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

            <SidebarItem
              title="Reportes"
              icon={<ReportsIcon />}
              isActive={router.pathname.startsWith("/reportes")}
              href="/reportes/ventas"
              onClickItem={setCollapsed}
            />

            <SidebarItem
              title="Vencimientos"
              icon={<ReportsIcon />}
              isActive={router.pathname.startsWith("/vencimientos")}
              href="/vencimientos/gestionar"
              onClickItem={setCollapsed}
            />

            <SidebarItem
              title="Ajustes"
              icon={<SettingsIcon />}
              isActive={router.pathname === "/settings"}
              href="/settings"
              onClickItem={setCollapsed}
            />

            <SidebarItem
              title="Novedades"
              icon={<ChangeLogIcon />}
              isActive={router.pathname === "/changelog"}
              href="/changelog"
              onClickItem={setCollapsed}
            />
          </nav>

          <div className="flex items-center justify-center gap-3 px-4 pt-6">
            <button
              type="button"
              title="Ajustes"
              className="grid h-8 w-8 place-items-center rounded-md text-gray-300 hover:bg-white/5 hover:text-white"
              onClick={() => router.push("/settings")}
            >
              <SettingsIcon />
            </button>

            <button
              type="button"
              title="Perfil"
              className="inline-grid h-8 w-8 overflow-hidden rounded-full ring-1 ring-white/10"
              onClick={() => router.push("/settings")}
            >
              <img
                src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
                alt="Perfil"
                className="h-full w-full object-cover"
              />
            </button>

            <button
              onClick={onLogout}
              className="ml-2 rounded-md bg-red-500 px-2 py-1 text-xs text-white transition hover:opacity-90"
              title="Cerrar sesión"
              type="button"
            >
              Salir
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
