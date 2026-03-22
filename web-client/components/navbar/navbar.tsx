import React from "react";
import { Navbar } from "@nextui-org/react";
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
  return (
    <Box
      css={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
        minHeight: "100vh",
        overflowX: "hidden",
        overflowY: "visible",
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
          zIndex: 200,
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
        <Navbar.Content
          css={{
            "@md": {
              display: "none",
            },
          }}
        >
          <BurguerButton />
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
      </Navbar>

      <Box
        as="main"
        css={{
          flex: "1 1 auto",
          minHeight: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};