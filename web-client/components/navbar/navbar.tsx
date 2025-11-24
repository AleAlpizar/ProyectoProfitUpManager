import React from "react";
import { Link, Navbar } from "@nextui-org/react";
import { Box } from "../styles/box";
import { BurguerButton } from "./burguer-button";
import { UserDropdown } from "./user-dropdown";
import VencimientosNotificationsBell from "./VencimientosNotificationsBell";

interface Props {
  children: React.ReactNode;
}

const BG = "#121618";
const TEXT = "#E6E9EA";
const BORDER = "rgba(255,255,255,0.08)";

export const NavbarWrapper: React.FC<Props> = ({ children }) => {
  const collapseItems = [
    "Profile",
    "Dashboard",
    "Activity",
    "Analytics",
    "System",
    "Deployments",
    "My Settings",
    "Team Settings",
    "Help & Feedback",
    "Log Out",
  ];

  return (
    <Box
      css={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
        overflowY: "auto",
        overflowX: "hidden",
        background: BG,
        color: TEXT,
      }}
    >
      <Navbar
        isBordered
        variant="sticky"
        css={{
          position: "sticky",
          top: 0,
          backdropFilter: "none",
          bg: BG,
          boxShadow: "none",
          borderBottom: `1px solid ${BORDER}`,
          justifyContent: "space-between",
          width: "100%",
          "& .nextui-navbar-container": {
            background: "transparent",
            backdropFilter: "none",
            boxShadow: "none",
            border: "none",
            maxWidth: "100%",
            gap: "$6",
            "@md": { justifyContent: "space-between" },
          },
          "& .nextui-navbar-content": {
            background: "transparent",
          },
          "& .nextui-navbar-wrapper": {
            background: "transparent",
            backdropFilter: "none",
            boxShadow: "none",
          },
        }}
      >
        <Navbar.Content showIn="md">
          <BurguerButton aria-label="Abrir menú" />
        </Navbar.Content>

        <Navbar.Content css={{ flex: 1 }} />

        <Navbar.Content>
          <Navbar.Content>
            <VencimientosNotificationsBell />
          </Navbar.Content>

          <Navbar.Content>
            <UserDropdown />
          </Navbar.Content>
        </Navbar.Content>

        <Navbar.Collapse>
          {collapseItems.map((item, index) => (
            <Navbar.CollapseItem
              key={item}
              activeColor="secondary"
              css={{
                color: index === collapseItems.length - 1 ? "$error" : TEXT,
                "&:hover": { opacity: 0.9 },
              }}
              isActive={index === 2}
            >
              <Link
                color="inherit"
                css={{ minWidth: "100%" }}
                href="#"
                className="hover:opacity-90"
              >
                {item}
              </Link>
            </Navbar.CollapseItem>
          ))}
        </Navbar.Collapse>
      </Navbar>

      {children}
    </Box>
  );
};
