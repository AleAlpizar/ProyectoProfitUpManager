import { styled } from "@nextui-org/react";

export const SidebarWrapper = styled("div", {
  overflow: "hidden",
  height: "100dvh",                 
  display: "flex",
  background: "#121618",            
  color: "#E6E9EA",
  borderRight: "1px solid rgba(255,255,255,.08)",
});

export const StyledBurgerButton = styled("button", {
  position: "absolute",
  insetInlineStart: "12px",         
  insetBlockStart: "12px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "44px",                    
  height: "44px",
  padding: 0,
  zIndex: "202",
  background: "transparent",
  border: "none",
  cursor: "pointer",

  "&:focus-visible": {
    outline: "none",
    boxShadow: "0 0 0 2px rgba(163,8,98,.45)", 
    borderRadius: "10px",
  },

  "& div": {
    position: "absolute",
    width: "22px",
    height: "2px",
    background: "#E6E9EA",
    borderRadius: "2px",
    transition: "transform .25s ease, opacity .25s ease, background-color .25s ease",
    transformOrigin: "center",
    willChange: "transform, opacity",
  },

  "& div:nth-child(1)": {
    transform: "translateY(-5px) rotate(0deg)",
  },
  "& div:nth-child(2)": {
    transform: "translateY(5px) rotate(0deg)",
  },

  "&:hover div": {
    background: "#ffffff",
  },

  "@media (prefers-reduced-motion: reduce)": {
    "& div": { transition: "none" },
  },

  variants: {
    open: {
      true: {
        "& div:nth-child(1)": {
          transform: "translateY(0px) rotate(45deg)",
          background: "#A30862", 
        },
        "& div:nth-child(2)": {
          transform: "translateY(0px) rotate(-45deg)",
          background: "#A30862",
        },
      },
    },
    color: {
      magenta: {
        "& div": { background: "#E6E9EA" },
        "&[data-hover] div": { background: "#fff" },
      },
      lima: {
        "& div": { background: "#E6E9EA" },
        "&[data-hover] div": { background: "#fff" },
        "&[data-open='true'] div": { background: "#95B64F" },
      },
    },
  },

  defaultVariants: {
    color: "magenta",
  },
});
