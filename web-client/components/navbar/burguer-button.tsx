import React from "react";
import { useSidebarContext } from "../layout/layout-context";
import { StyledBurgerButton } from "./navbar.styles";

type Props = {
  "aria-label"?: string;
  className?: string;
  disabled?: boolean;
  title?: string;
};

export const BurguerButton: React.FC<Props> = ({
  "aria-label": ariaLabel,
  className,
  disabled,
  title,
}) => {
  const { collapsed, setCollapsed } = useSidebarContext();

  return (
    <StyledBurgerButton
      open={collapsed}
      onClick={setCollapsed}
      type="button"
      aria-expanded={collapsed}
      aria-label={ariaLabel ?? (collapsed ? "Cerrar menú" : "Abrir menú")}
      className={className}
      disabled={disabled}
      title={title}
    >
      <div />
      <div />
    </StyledBurgerButton>
  );
};