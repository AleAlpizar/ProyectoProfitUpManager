import { createContext, useContext } from "react";

export type SidebarCtx = {
  collapsed: boolean;
  setCollapsed: () => void;
};

export const SidebarContext = createContext<SidebarCtx>({
  collapsed: false,
  setCollapsed: () => {},
});

export const useSidebarContext = () => useContext(SidebarContext);
