import React from "react";
import { Input, Link, Navbar, Text } from "@nextui-org/react";
import { FeedbackIcon } from "../icons/navbar/feedback-icon";
import { SupportIcon } from "../icons/navbar/support-icon";
import { SearchIcon } from "../icons/searchicon";
import { Box } from "../styles/box";
import { Flex } from "../styles/flex";
import { BurguerButton } from "./burguer-button";
import { NotificationsDropdown } from "./notifications-dropdown";
import { UserDropdown } from "./user-dropdown";

interface Props {
  children: React.ReactNode;
}

const BG = "#121618";
const TEXT = "#E6E9EA";
const MUTED = "#8B9AA0";
const BORDER = "rgba(255,255,255,0.08)";
const ACCENT = "#A30862";

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
          backdropFilter: "saturate(180%) blur(8px)",
          bg: `${BG}AA`, 
          borderBottom: `1px solid ${BORDER}`,
          justifyContent: "space-between",
          width: "100%",
          "@md": {
            justifyContent: "space-between",
          },
          "& .nextui-navbar-container": {
            border: "none",
            maxWidth: "100%",
            gap: "$6",
            "@md": { justifyContent: "space-between" },
          },
        }}
      >
        <Navbar.Content showIn="md">
          <BurguerButton aria-label="Abrir menú" />
        </Navbar.Content>

        <Navbar.Content hideIn={"md"} css={{ width: "100%" }}>
          <Input
            clearable
            aria-label="Buscar"
            contentLeft={<SearchIcon fill={MUTED} size={16} />}
            contentLeftStyling={false}
            placeholder="Buscar…"
            css={{
              "w": "100%",
              "transition": "all 0.2s ease",
              "@xsMax": { w: "100%" },
              "& .nextui-input-content--left": {
                h: "100%",
                ml: "$4",
                dflex: "center",
              },
              "& input": {
                color: TEXT,
                "::placeholder": { color: `${MUTED}` },
              },
              "& .nextui-input-wrapper": {
                bg: "rgba(255,255,255,0.04)",
                border: `1px solid ${BORDER}`,
              },
              "&:focus-within .nextui-input-wrapper": {
                border: `1px solid ${ACCENT}`,
                boxShadow: `0 0 0 2px ${ACCENT}40`,
              },
            }}
          />
        </Navbar.Content>

        <Navbar.Content>
          <Navbar.Content hideIn={"md"}>
          </Navbar.Content>

          <Navbar.Content>
            <NotificationsDropdown />
          </Navbar.Content>

          <Navbar.Content hideIn={"md"}>
            <button
              aria-label="Soporte"
              title="Soporte"
              style={{ color: MUTED }}
              className="hover:opacity-90"
            >
              <SupportIcon />
            </button>
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
