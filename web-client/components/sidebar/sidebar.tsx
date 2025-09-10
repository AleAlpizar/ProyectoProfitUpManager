import React from "react";
import { Box } from "../styles/box";
import { Sidebar } from "./sidebar.styles";
import { Avatar, Tooltip } from "@nextui-org/react";
import { Flex } from "../styles/flex";
import { CompaniesDropdown } from "./companies-dropdown";
import { HomeIcon } from "../icons/sidebar/home-icon";
import { PaymentsIcon } from "../icons/sidebar/payments-icon";
import { BalanceIcon } from "../icons/sidebar/balance-icon";
import { AccountsIcon } from "../icons/sidebar/accounts-icon";
import { CustomersIcon } from "../icons/sidebar/customers-icon";
import { ProductsIcon } from "../icons/sidebar/products-icon";
import { ReportsIcon } from "../icons/sidebar/reports-icon";
import { DevIcon } from "../icons/sidebar/dev-icon";
import { ViewIcon } from "../icons/sidebar/view-icon";
import { SettingsIcon } from "../icons/sidebar/settings-icon";
import { CollapseItems } from "./collapse-items";
import { SidebarItem } from "./sidebar-item";
import { SidebarMenu } from "./sidebar-menu";
import { FilterIcon } from "../icons/sidebar/filter-icon";
import { useSidebarContext } from "../layout/layout-context";
import { ChangeLogIcon } from "../icons/sidebar/changelog-icon";
import { useRouter } from "next/router";

export const SidebarWrapper = () => {
  const router = useRouter();
  const { collapsed, setCollapsed } = useSidebarContext();

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
              title="Home"
              icon={<HomeIcon />}
              isActive={router.pathname === "/"}
              href="/"
            />

            <SidebarMenu title="Administracion">
              <SidebarItem
                isActive={router.pathname === "/accounts"}
                title="Cuentas"
                icon={<AccountsIcon />}
                href="/accounts"
              />

              {/* <CollapseItems
                    icon={<BalanceIcon />}
                    items={['Banks Accounts', 'Credit Cards', 'Loans']}
                    title="Balances"
              /> */}
            </SidebarMenu>

            <SidebarMenu title="Clientes">
              <SidebarItem
                isActive={router.pathname === "/customers"}
                title="Clientes"
                icon={<CustomersIcon />}
                href="/customers"
              />

              {/* <CollapseItems
                  icon={<BalanceIcon />}
                  items={['Banks Accounts', 'Credit Cards', 'Loans']}
                  title="Balances"
              /> */}
            </SidebarMenu>

            <SidebarMenu title="Operaciones">
              <SidebarItem
                isActive={router.pathname.startsWith("/compras")}
                title="Compras"
                icon={<ProductsIcon />}
                href="/compras/ordenes"
              />
              <SidebarItem
                isActive={router.pathname.startsWith("/ventas")}
                title="Registrar venta"
                icon={<PaymentsIcon />}
                href="/ventas/registrar"
              />

              <SidebarMenu title="Inventario">
                <SidebarItem
                  isActive={
                    router.pathname === "/inventario" ||
                    router.pathname.startsWith("/inventario/index")
                  }
                  title="Inicio"
                  icon={<ProductsIcon />}
                  href="/inventario"
                />
                <SidebarItem
                  isActive={router.pathname.startsWith("/inventario/productos")}
                  title="Productos"
                  icon={<ProductsIcon />}
                  href="/inventario/productos"
                />
                <SidebarItem
                  isActive={router.pathname.startsWith("/inventario/bodegas")}
                  title="Bodegas"
                  icon={<ProductsIcon />}
                  href="/inventario/bodegas"
                />
                <SidebarItem
                  isActive={router.pathname.startsWith(
                    "/inventario/existencias"
                  )}
                  title="Existencias"
                  icon={<ProductsIcon />}
                  href="/inventario/existencias"
                />
                <SidebarItem
                  isActive={router.pathname.startsWith(
                    "/inventario/descuentos"
                  )}
                  title="Descuentos"
                  icon={<ProductsIcon />}
                  href="/inventario/descuentos"
                />
              </SidebarMenu>

              <SidebarMenu title="Reportes">
                <SidebarItem
                  isActive={router.pathname === "/reportes/ventas"}
                  title="Ventas"
                  icon={<ReportsIcon />}
                  href="/reportes/ventas"
                />
                <SidebarItem
                  isActive={router.pathname === "/reportes/inventario"}
                  title="Inventario"
                  icon={<ReportsIcon />}
                  href="/reportes/inventario"
                />
                <SidebarItem
                  isActive={router.pathname === "/reportes/ordenes"}
                  title="Órdenes de compra"
                  icon={<ReportsIcon />}
                  href="/reportes/ordenes"
                />
                <SidebarItem
                  isActive={router.pathname === "/reportes/historial"}
                  title="Historial"
                  icon={<ChangeLogIcon />}
                  href="/reportes/historial"
                />
              </SidebarMenu>
            </SidebarMenu>

            <SidebarMenu title="Vencimientos">
              <SidebarItem
                isActive={router.pathname === "/vencimientos/gestionar"}
                title="Gestionar"
                icon={<ReportsIcon />}
                href="/vencimientos/gestionar"
              />
            </SidebarMenu>

            <SidebarMenu title="General">
              <SidebarItem
                isActive={router.pathname === "/developers"}
                title="Developers"
                icon={<DevIcon />}
                href="/developers"
              />
              <SidebarItem
                isActive={router.pathname === "/view"}
                title="View Test Data"
                icon={<ViewIcon />}
                href="/view"
              />
              <SidebarItem
                isActive={router.pathname === "/settings"}
                title="Settings"
                icon={<SettingsIcon />}
                href="/settings"
              />
            </SidebarMenu>

            <SidebarMenu title="Updates">
              <SidebarItem
                isActive={router.pathname === "/changelog"}
                title="Changelog"
                icon={<ChangeLogIcon />}
                href="/changelog"
              />
            </SidebarMenu>
          </Sidebar.Body>

          <Sidebar.Footer>
            <Tooltip content={"Settings"} rounded color="primary">
              <SettingsIcon />
            </Tooltip>
            <Tooltip content={"Adjustments"} rounded color="primary">
              <FilterIcon />
            </Tooltip>
            <Tooltip content={"Profile"} rounded color="primary">
              <Avatar
                src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
                size={"sm"}
              />
            </Tooltip>
          </Sidebar.Footer>
        </Flex>
      </Sidebar>
    </Box>
  );
};
