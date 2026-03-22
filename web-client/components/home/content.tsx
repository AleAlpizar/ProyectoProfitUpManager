import React from "react";
import { Text } from "@nextui-org/react";
import { useRouter } from "next/router";

import { Box } from "../styles/box";
import { Flex } from "../styles/flex";
import { useSession } from "../hooks/useSession";

const BG_ROOT = "#050608";
const SURFACE = "#0B0C11";
const SURFACE_HOVER = "#181A24";
const TEXT = "#F5F3F7";
const MUTED = "#A69BB5";
const MUTED_SOFT = "#8E839D";
const BORDER = "rgba(255,255,255,0.09)";
const BORDER_SOFT = "rgba(255,255,255,0.06)";
const ACCENT = "#A30862";
const ACCENT_SOFT = "rgba(163,8,98,0.18)";

type Role = "admin" | "seller";

type ModuleCard = {
  label: string;
  description: string;
  href: string;
  sellerHref?: string;
  roles?: Role[];
};

const modules: ModuleCard[] = [
  {
    label: "Administración",
    description:
      "Usuarios, roles, permisos y seguridad del acceso a ProfitUp Manager.",
    href: "/accounts",
    roles: ["admin"],
  },
  {
    label: "Clientes",
    description:
      "Ficha de clientes, datos de contacto y base para el programa de fidelidad.",
    href: "/customers",
    roles: ["admin", "seller"],
  },
  {
    label: "Operaciones / Compras",
    description:
      "Órdenes de compra a proveedores y control del abastecimiento de la bodega.",
    href: "/compras",
    roles: ["admin"],
  },
  {
    label: "Ventas",
    description:
      "Registro de ventas, consulta de historial y detalle de cada operación.",
    href: "/ventas",
    sellerHref: "/ventas/registrar",
    roles: ["admin", "seller"],
  },
  {
    label: "Inventario",
    description:
      "Existencias por bodega, movimientos y ajustes de inventario de cada referencia.",
    href: "/inventario/inventario",
    roles: ["admin", "seller"],
  },
  {
    label: "Vencimientos",
    description:
      "Documentos y compromisos con fecha de vencimiento, recordatorios y seguimiento.",
    href: "/vencimientos/gestionar",
    roles: ["admin"],
  },
  {
    label: "Reportes",
    description:
      "Reportes de ventas, clientes e inventario para análisis de resultados.",
    href: "/reportes",
    roles: ["admin"],
  },
  {
    label: "Perfil",
    description:
      "Datos del usuario, sesión activa y preferencias personales dentro del sistema.",
    href: "/Perfil/perfil",
    roles: ["admin", "seller"],
  },
];

function normalizeRole(value: unknown): string {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

const ModuleIcon: React.FC<{ label: string }> = ({ label }) => {
  const commonProps = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (label) {
    case "Administración":
      return (
        <svg {...commonProps}>
          <path d="M12 3l7 4v5c0 5-3.4 8-7 9-3.6-1-7-4-7-9V7l7-4z" />
          <path d="M9.5 12l1.5 1.5L14.5 10" />
        </svg>
      );

    case "Clientes":
      return (
        <svg {...commonProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9.5" cy="7" r="3" />
          <path d="M20 8v6" />
          <path d="M23 11h-6" />
        </svg>
      );

    case "Operaciones / Compras":
      return (
        <svg {...commonProps}>
          <path d="M3 7h13l2 10H5L3 7z" />
          <path d="M16 7l-2-3H8L6 7" />
          <path d="M9 11h6" />
        </svg>
      );

    case "Ventas":
      return (
        <svg {...commonProps}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 9h8" />
          <path d="M8 13h5" />
          <path d="M15.5 16.5l2-2" />
        </svg>
      );

    case "Inventario":
      return (
        <svg {...commonProps}>
          <path d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" />
          <path d="M4 12l8 4.5 8-4.5" />
          <path d="M4 16.5L12 21l8-4.5" />
        </svg>
      );

    case "Vencimientos":
      return (
        <svg {...commonProps}>
          <rect x="4" y="5" width="16" height="16" rx="2" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M4 10h16" />
          <path d="M12 13v4" />
          <path d="M10 15h4" />
        </svg>
      );

    case "Reportes":
      return (
        <svg {...commonProps}>
          <path d="M5 19V9" />
          <path d="M12 19V5" />
          <path d="M19 19v-7" />
        </svg>
      );

    case "Perfil":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );

    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
};

export const Content: React.FC = () => {
  const router = useRouter();
  const { me, isAuthenticated } = useSession();

  const rawRole: string =
    (me as any)?.rolNombre ||
    (me as any)?.rol?.nombre ||
    (me as any)?.rol ||
    "";

  const normalizedRole = normalizeRole(rawRole);

  const isAdmin = normalizedRole === "ADMINISTRADOR";
  const isSeller =
    normalizedRole === "VENDEDOR" || normalizedRole === "EMPLEADO";

  const isGuest = !isAuthenticated || (!isAdmin && !isSeller);

  const filteredModules = modules.filter((mod) => {
    if (isGuest) return false;

    const allowedRoles = mod.roles ?? ["admin", "seller"];
    if (isAdmin) return allowedRoles.includes("admin");
    if (isSeller) return allowedRoles.includes("seller");
    return false;
  });

  const handleModuleClick = async (mod: ModuleCard) => {
    if (isGuest) return;

    const targetHref =
      isSeller && !isAdmin && mod.sellerHref ? mod.sellerHref : mod.href;

    if (!targetHref || router.asPath === targetHref) return;

    await router.push(targetHref);
  };

  return (
    <Box
      css={{
        overflow: "hidden",
        minHeight: "100%",
        background:
          "radial-gradient(circle at top left, rgba(163,8,98,0.08), transparent 28%), #050608",
      }}
    >
      <Box
        css={{
          px: "$12",
          pt: "$12",
          pb: "$7",
          "@xsMax": { px: "$10", pt: "$10" },
        }}
      >
        <Box
          css={{
            width: "100%",
            maxWidth: "52rem",
          }}
        >
          <Text
            span
            css={{
              color: MUTED,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontSize: "0.7rem",
              fontWeight: 600,
            }}
          >
            ProfitUp · Panel operativo
          </Text>

          <Text
            h1
            css={{
              color: TEXT,
              lineHeight: 1.05,
              fontSize: "2.6rem",
              mt: "$4",
              mb: "$4",
              letterSpacing: "-0.03em",
              "@xsMax": {
                fontSize: "2.1rem",
              },
            }}
          >
            ProfitUp Manager
          </Text>

          <Text
            span
            css={{
              color: MUTED,
              fontSize: "0.98rem",
              lineHeight: 1.85,
              display: "block",
              maxWidth: "42rem",
            }}
          >
            Sistema administrativo para la operación diaria de una empresa que
            vende vinos. Desde aquí accedes a los módulos clave de tu operación.
          </Text>
        </Box>
      </Box>

      <Box
        css={{
          px: "$12",
          pb: "$12",
          "@xsMax": { px: "$10" },
        }}
      >
        <Flex
          direction={"column"}
          css={{
            gap: "$10",
            width: "100%",
          }}
        >
          <Box>
            <Flex
              justify={"between"}
              align={"center"}
              css={{
                mb: "$4",
                gap: "$4",
                flexWrap: "wrap",
              }}
            >
              <Text
                h3
                css={{
                  color: TEXT,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Módulos disponibles
              </Text>

              {!isGuest && (
                <Text
                  span
                  css={{
                    color: MUTED_SOFT,
                    fontSize: "0.8rem",
                  }}
                >
                  Selecciona un módulo para continuar.
                </Text>
              )}
            </Flex>

            <Box
              css={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0.01))",
                borderRadius: "$2xl",
                border: `1px solid ${BORDER}`,
                px: "$8",
                py: "$8",
                boxShadow: "0 18px 48px rgba(0,0,0,0.32)",
                "@xsMax": {
                  px: "$6",
                  py: "$6",
                },
              }}
            >
              {isGuest ? (
                <Box
                  css={{
                    borderRadius: "$xl",
                    border: `1px dashed ${BORDER}`,
                    background: "rgba(255,255,255,0.015)",
                    px: "$6",
                    py: "$6",
                  }}
                >
                  <Text
                    span
                    css={{
                      color: MUTED,
                      fontSize: "0.92rem",
                      lineHeight: 1.7,
                    }}
                  >
                    Debes iniciar sesión para ver y acceder a los módulos de
                    ProfitUp Manager.
                  </Text>
                </Box>
              ) : filteredModules.length === 0 ? (
                <Box
                  css={{
                    borderRadius: "$xl",
                    border: `1px dashed ${BORDER}`,
                    background: "rgba(255,255,255,0.015)",
                    px: "$6",
                    py: "$6",
                  }}
                >
                  <Text
                    span
                    css={{
                      color: MUTED,
                      fontSize: "0.92rem",
                      lineHeight: 1.7,
                    }}
                  >
                    Tu usuario no tiene módulos disponibles en este momento.
                    Verifica tus permisos de acceso.
                  </Text>
                </Box>
              ) : (
                <Box
                  css={{
                    display: "grid",
                    gap: "$5",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(240px, 1fr))",
                    width: "100%",
                  }}
                >
                  {filteredModules.map((mod) => (
                    <Box
                      key={mod.label}
                      as="button"
                      onClick={() => void handleModuleClick(mod)}
                      aria-label={`Abrir módulo ${mod.label}`}
                      css={{
                        all: "unset",
                        borderRadius: "20px",
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
                        border: `1px solid ${BORDER_SOFT}`,
                        px: "$6",
                        py: "$5",
                        display: "flex",
                        flexDirection: "column",
                        gap: "$3",
                        cursor: "pointer",
                        minHeight: "156px",
                        transition:
                          "transform 0.16s ease-out, border-color 0.16s ease-out, background 0.16s ease-out, box-shadow 0.16s ease-out",
                        boxShadow: "0 10px 28px rgba(0,0,0,0.34)",
                        "&:hover": {
                          transform: "translateY(-3px)",
                          borderColor: ACCENT,
                          background: SURFACE_HOVER,
                          boxShadow: `0 18px 40px rgba(0,0,0,0.52), 0 0 0 1px ${ACCENT_SOFT} inset`,
                        },
                        "&:focus-visible": {
                          outline: `2px solid ${ACCENT}`,
                          outlineOffset: "2px",
                        },
                      }}
                    >
                      <Box
                        css={{
                          width: "2.85rem",
                          height: "2.85rem",
                          borderRadius: "14px",
                          background:
                            "linear-gradient(180deg, rgba(163,8,98,0.18), rgba(163,8,98,0.08))",
                          border: "1px solid rgba(163,8,98,0.24)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: ACCENT,
                          flexShrink: 0,
                          boxShadow: "0 10px 24px rgba(163,8,98,0.12)",
                        }}
                      >
                        <ModuleIcon label={mod.label} />
                      </Box>

                      <Text
                        span
                        css={{
                          color: TEXT,
                          fontWeight: 700,
                          fontSize: "1rem",
                          lineHeight: 1.35,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {mod.label}
                      </Text>

                      <Text
                        span
                        css={{
                          color: MUTED,
                          fontSize: "0.84rem",
                          lineHeight: 1.75,
                        }}
                      >
                        {mod.description}
                      </Text>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>

          <Box>
            <Text
              h3
              css={{
                color: TEXT,
                mb: "$4",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontSize: "0.78rem",
                fontWeight: 700,
                marginTop: 0,
              }}
            >
              Flujo diario recomendado
            </Text>

            <Box
              css={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0.01))",
                borderRadius: "$2xl",
                border: `1px solid ${BORDER}`,
                px: "$8",
                py: "$7",
                boxShadow: "0 18px 48px rgba(0,0,0,0.28)",
                "@xsMax": {
                  px: "$6",
                  py: "$6",
                },
              }}
            >
              <Text
                span
                css={{
                  color: MUTED,
                  fontSize: "0.88rem",
                  lineHeight: 1.95,
                  maxWidth: "54rem",
                  display: "block",
                }}
              >
                Revisa primero el inventario y los vencimientos próximos. Luego
                registra tus ventas para mantener el stock al día y utiliza
                Operaciones para garantizar el abastecimiento de la bodega.
                Finalmente, consulta los reportes para analizar resultados y
                ajusta permisos y usuarios desde Administración cuando sea
                necesario.
              </Text>
            </Box>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default Content;