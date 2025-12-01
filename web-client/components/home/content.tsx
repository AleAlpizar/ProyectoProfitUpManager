import React from "react";
import { Text } from "@nextui-org/react";
import { useRouter } from "next/router";

import { Box } from "../styles/box";
import { Flex } from "../styles/flex";
import { useSession } from "../hooks/useSession";

const BG_ROOT = "#050608";
const SURFACE = "#0B0C11";
const SURFACE_SOFT = "#151721";
const TEXT = "#F5F3F7";
const MUTED = "#A69BB5";
const BORDER = "rgba(255,255,255,0.09)";
const ACCENT = "#A30862";

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

export const Content: React.FC = () => {
  const router = useRouter();
  const { me, isAuthenticated } = useSession();

  const rawRole: string =
    (me as any)?.rolNombre ||
    (me as any)?.rol?.nombre ||
    (me as any)?.rol ||
    "";

  const normalizedRole = rawRole.toUpperCase();

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

  const handleModuleClick = (mod: ModuleCard) => {
    if (isGuest) return;

    const targetHref =
      isSeller && !isAdmin && mod.sellerHref ? mod.sellerHref : mod.href;

    router.push(targetHref);
  };

  return (
    <Box
      css={{
        overflow: "hidden",
        minHeight: "100%",
        background: BG_ROOT,
      }}
    >
      <Box
        css={{
          px: "$12",
          pt: "$10",
          pb: "$6",
          "@xsMax": { px: "$10" },
        }}
      >
        <Box
          css={{
            width: "100%",
          }}
        >
          <Text
            span
            css={{
              color: MUTED,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontSize: "0.72rem",
            }}
          >
            ProfitUp · Panel operativo
          </Text>

          <Text
            h1
            css={{
              color: TEXT,
              lineHeight: 1.1,
              fontSize: "2.4rem",
              mt: "$4",
              mb: "$3",
            }}
          >
            ProfitUp Manager
          </Text>

          <Text
            span
            css={{
              color: MUTED,
              fontSize: "0.95rem",
              lineHeight: 1.7,
              display: "block",
              maxWidth: "40rem",
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
            gap: "$8",
            width: "100%",
          }}
        >
          <Box>
            <Flex
              justify={"between"}
              align={"center"}
              css={{ mb: "$3", gap: "$4", flexWrap: "wrap" }}
            >
              <Text
                h3
                css={{
                  color: TEXT,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontSize: "0.8rem",
                }}
              >
                Módulos disponibles
              </Text>

              {!isGuest && (
                <Text
                  span
                  css={{
                    color: MUTED,
                    fontSize: "0.8rem",
                  }}
                >
                  Selecciona un módulo para continuar.
                </Text>
              )}
            </Flex>

            <Box
              css={{
                background: SURFACE,
                borderRadius: "$2xl",
                border: `1px solid ${BORDER}`,
                px: "$8",
                py: "$8",
              }}
            >
              {isGuest ? (
                <Text
                  span
                  css={{
                    color: MUTED,
                    fontSize: "0.9rem",
                  }}
                >
                  Debes iniciar sesión para ver y acceder a los módulos de
                  ProfitUp Manager.
                </Text>
              ) : (
                <Box
                  css={{
                    display: "grid",
                    gap: "$4",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(230px, 1fr))",
                    width: "100%",
                  }}
                >
                  {filteredModules.map((mod) => (
                    <Box
                      key={mod.label}
                      as="button"
                      onClick={() => handleModuleClick(mod)}
                      css={{
                        all: "unset",
                        borderRadius: "$lg",
                        background: SURFACE_SOFT,
                        border: `1px solid rgba(255,255,255,0.06)`,
                        px: "$5",
                        py: "$4",
                        display: "flex",
                        flexDirection: "column",
                        gap: "$2",
                        cursor: "pointer",
                        transition:
                          "transform 0.15s ease-out, border-color 0.15s ease-out, background 0.15s ease-out, box-shadow 0.15s ease-out",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          borderColor: ACCENT,
                          background: "#181A24",
                          boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
                        },
                        "&:focus-visible": {
                          outline: `2px solid ${ACCENT}`,
                          outlineOffset: "2px",
                        },
                      }}
                    >
                      <Text
                        span
                        css={{
                          color: TEXT,
                          fontWeight: "600",
                          fontSize: "0.95rem",
                        }}
                      >
                        {mod.label}
                      </Text>

                      <Text
                        span
                        css={{
                          color: MUTED,
                          fontSize: "0.84rem",
                          lineHeight: 1.6,
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
                mb: "$3",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontSize: "0.8rem",
              }}
            >
              Flujo diario recomendado
            </Text>

            <Box
              css={{
                background: SURFACE,
                borderRadius: "$2xl",
                border: `1px solid ${BORDER}`,
                px: "$8",
                py: "$7",
              }}
            >
              <Text
                span
                css={{
                  color: MUTED,
                  fontSize: "0.85rem",
                  lineHeight: 1.8,
                  maxWidth: "50rem",
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
