import React from "react";
import { useLockedBody } from "../hooks/useBodyLock";
import { NavbarWrapper } from "../navbar/navbar";
import SidebarWrapper from "../sidebar/sidebar";

import { SidebarContext } from "./layout-context";
import { WrapperLayout } from "./layout.styles";

type LayoutProps = {
  children: React.ReactNode;
  noChrome?: boolean;
};

export const Layout: React.FC<LayoutProps> = ({ children, noChrome = false }) => {
  // 👇 Los hooks SIEMPRE se llaman, nunca dentro de un if
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [, setLocked] = useLockedBody(false);

  const handleToggleSidebar = React.useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev;
      setLocked(next);
      return next;
    });
  }, [setLocked]);

  // 👇 Después de los hooks ya puedes hacer returns condicionales
  if (noChrome) {
    const bg = "var(--color-background, #0B0F0E)";
    const fg = "var(--color-secondary, #E6E9EA)";
    return (
      <div
        className="min-h-screen"
        style={{ background: bg, color: fg }}
      >
        {children}
      </div>
    );
  }

  return (
    <SidebarContext.Provider
      value={{
        collapsed: sidebarOpen,
        setCollapsed: handleToggleSidebar,
      }}
    >
      <WrapperLayout>
        <SidebarWrapper />
        <NavbarWrapper>{children}</NavbarWrapper>
      </WrapperLayout>
    </SidebarContext.Provider>
  );
};
