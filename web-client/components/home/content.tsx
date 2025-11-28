import React from "react";
import { Text } from "@nextui-org/react";

import { Box } from "../styles/box";
import { Flex } from "../styles/flex";

const BG_ROOT = "#0B0F0E";
const SURFACE = "#121018";
const SURFACE_SOFT = "#191320";
const TEXT = "#F5F3F7";
const MUTED = "#A69BB5";
const BORDER = "rgba(255,255,255,0.09)";
const ACCENT = "#A30862";

const modules = [
  {
    label: "Administración",
    description:
      "Usuarios, roles, permisos y seguridad del acceso a ProfitUp Manager.",
  },
  {
    label: "Clientes",
    description:
      "Ficha de clientes, datos de contacto y base para el programa de fidelidad.",
  },
  {
    label: "Operaciones / Compras",
    description:
      "Órdenes de compra a proveedores y control del abastecimiento de la bodega.",
  },
  {
    label: "Ventas",
    description:
      "Registro de ventas, consulta de historial y detalle de cada operación.",
  },
  {
    label: "Inventario",
    description:
      "Existencias por bodega, movimientos y ajustes de inventario de cada referencia.",
  },
  {
    label: "Vencimientos",
    description:
      "Documentos y compromisos con fecha de vencimiento, recordatorios y seguimiento.",
  },
  {
    label: "Reportes",
    description:
      "Reportes de ventas, clientes e inventario para análisis de resultados.",
  },
  {
    label: "Perfil",
    description:
      "Datos del usuario, sesión activa y preferencias personales dentro del sistema.",
  },
];

export const Content: React.FC = () => {
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
              fontSize: "2.6rem",
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
            }}
          >
            Sistema administrativo para la operación diaria de una empresa que
            vende vinos. Desde este panel tienes una vista clara de las áreas
            principales: administración, clientes, operaciones de compra, ventas,
            inventario, vencimientos y reportes.
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
              Áreas del sistema ProfitUp Manager
            </Text>

            <Box
              css={{
                background: SURFACE,
                borderRadius: "$2xl",
                border: `1px solid ${BORDER}`,
                px: "$8",
                py: "$8",
              }}
            >
              <Box
                css={{
                  display: "grid",
                  gap: "$4",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  width: "100%",
                }}
              >
                {modules.map((mod) => (
                  <Box
                    key={mod.label}
                    css={{
                      borderRadius: "$lg",
                      background: SURFACE_SOFT,
                      border: `1px solid rgba(255,255,255,0.04)`,
                      px: "$5",
                      py: "$4",
                      display: "flex",
                      flexDirection: "column",
                      gap: "$1",
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
                        fontSize: "0.82rem",
                      }}
                    >
                      {mod.description}
                    </Text>
                  </Box>
                ))}
              </Box>
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
              Cómo usar ProfitUp Manager en el día a día
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
                  lineHeight: 1.7,
                }}
              >
                Comienza revisando el estado de inventario por bodega y los
                vencimientos próximos. Registra las ventas desde el módulo de
                Ventas para que el stock se mantenga alineado con la realidad.
                Utiliza Operaciones para controlar las compras a proveedores y
                mantener abastecida la bodega. Finalmente, apóyate en los
                Reportes para analizar resultados y en Administración para
                gestionar los usuarios y permisos de tu equipo dentro de
                ProfitUp Manager.
              </Text>
            </Box>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default Content;
