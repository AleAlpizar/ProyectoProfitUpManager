import React from "react";
import { Box } from "../styles/box";
import { Sidebar } from "./sidebar.styles";
import { Avatar, Tooltip } from "@nextui-org/react";
import { Flex } from "../styles/flex";
import { CompaniesDropdown } from "./companies-dropdown";

import { HomeIcon } from "../icons/sidebar/home-icon";
import { PaymentsIcon } from "../icons/sidebar/payments-icon";
import { AccountsIcon } from "../icons/sidebar/accounts-icon";
import { CustomersIcon } from "../icons/sidebar/customers-icon";
import { ProductsIcon } from "../icons/sidebar/products-icon";
import { ReportsIcon } from "../icons/sidebar/reports-icon";
import { SettingsIcon } from "../icons/sidebar/settings-icon";
import { SidebarItem } from "./sidebar-item";
import { FilterIcon } from "../icons/sidebar/filter-icon";
import { ChangeLogIcon } from "../icons/sidebar/changelog-icon";

import { useSidebarContext } from "../layout/layout-context";
import { useRouter } from "next/router";
import { useSession } from "@/hooks/useSession";

export const SidebarWrapper = () => {
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
    <Box
      as="aside"
      css={{
        height: "100vh",
        zIndex: 202,
        position: "sticky",
        top: "0",
      }}
    >
      {collapsed ? <Sidebar.Overlay onClick={setCollapsed} /> : null}

      <Sidebar collapsed={collapsed}>
        <Sidebar.Header>
          <CompaniesDropdown />
        </Sidebar.Header>

        <Flex direction={"column"} justify={"between"} css={{ height: "100%" }}>
          <Sidebar.Body className="body sidebar">
            <SidebarItem
              title="Inicio"
              icon={<HomeIcon />}
              isActive={router.pathname === "/"}
              href="/"
            />

            <SidebarItem
              title="Administración"
              icon={<AccountsIcon />}
              isActive={router.pathname === "/accounts"}
              href="/accounts"
            />

            <SidebarItem
              title="Clientes"
              icon={<CustomersIcon />}
              isActive={router.pathname === "/customers"}
              href="/customers"
            />

            <SidebarItem
              title="Operaciones"
              icon={<PaymentsIcon />}
              isActive={router.pathname.startsWith("/compras") || router.pathname.startsWith("/ventas")}
              href="/compras/ordenes"
            />

            <SidebarItem
              title="Inventario"
              icon={<ProductsIcon />}
              isActive={router.pathname.startsWith("/inventario")}
              href="/inventario/inventario"
            />

            <SidebarItem
              title="Reportes"
              icon={<ReportsIcon />}
              isActive={router.pathname.startsWith("/reportes")}
              href="/reportes/ventas"
            />

            <SidebarItem
              title="Vencimientos"
              icon={<ReportsIcon />}
              isActive={router.pathname.startsWith("/vencimientos")}
              href="/vencimientos/gestionar"
            />

            <SidebarItem
              title="Ajustes"
              icon={<SettingsIcon />}
              isActive={router.pathname === "/settings"}
              href="/settings"
            />

            <SidebarItem
              title="Novedades"
              icon={<ChangeLogIcon />}
              isActive={router.pathname === "/changelog"}
              href="/changelog"
            />
          </Sidebar.Body>

          <Sidebar.Footer>
            <Tooltip content={"Ajustes"} rounded color="primary">
              <SettingsIcon />
            </Tooltip>
            <Tooltip content={"Filtros"} rounded color="primary">
              <FilterIcon />
            </Tooltip>
            <Tooltip content={"Perfil"} rounded color="primary">
              <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026704d" size={"sm"} />
            </Tooltip>

            <button
              onClick={onLogout}
              className="ml-2 rounded-md px-2 py-1 text-xs bg-red-500 text-white hover:opacity-90"
              title="Cerrar sesión"
            >
              Salir
            </button>
          </Sidebar.Footer>
        </Flex>
      </Sidebar>
    </Box>
  );
};
