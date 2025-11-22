import React from "react";
import { Text, Link } from "@nextui-org/react";
import NextLink from "next/link";

import { Box } from "../styles/box";
import { Flex } from "../styles/flex";
import { TableWrapper } from "../table/table";

import { CardBalance1 } from "./card-balance1";
import { CardBalance2 } from "./card-balance2";
import { CardBalance3 } from "./card-balance3";
import { CardAgents } from "./card-agents";
import { CardTransactions } from "./card-transactions";

const BG_ROOT = "#0B0F0E";
const SURFACE = "#121618";
const TEXT = "#E6E9EA";
const MUTED = "#8B9AA0";
const MAGENTA = "#A30862";

export const Content: React.FC = () => (
  <Box css={{ overflow: "hidden", height: "100%", background: BG_ROOT }}>
    <Flex
      css={{
        gap: "$8",
        pt: "$5",
        height: "fit-content",
        flexWrap: "wrap",
        "@lg": { flexWrap: "nowrap" },
        "@sm": { pt: "$10" },
      }}
      justify={"center"}
    >
      <Flex
        css={{
          px: "$12",
          mt: "$8",
          "@xsMax": { px: "$10" },
          gap: "$12",
        }}
        direction={"column"}
      >
        <Box>
          <Text
            h3
            css={{
              color: TEXT,
              textAlign: "center",
              letterSpacing: "0.2px",
              "@sm": { textAlign: "inherit" },
            }}
          >
            Available Balance
          </Text>
          <Flex
            css={{
              gap: "$10",
              flexWrap: "wrap",
              justifyContent: "center",
              "@sm": { flexWrap: "nowrap" },
            }}
            direction={"row"}
          >
            <CardBalance1 />
            <CardBalance2 />
            <CardBalance3 />
          </Flex>
        </Box>

        <Box>
          <Text
            h3
            css={{
              color: TEXT,
              textAlign: "center",
              letterSpacing: "0.2px",
              "@lg": { textAlign: "inherit" },
            }}
          >
            Statistics
          </Text>
          <Box
            css={{
              width: "100%",
              backgroundColor: SURFACE,
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 20px 60px rgba(0,0,0,.45)",
              borderRadius: "$2xl",
              px: "$10",
              py: "$10",
            }}
          >
            <Text
              css={{
                color: MUTED,
                fontSize: "0.875rem",
                textAlign: "center",
              }}
            >
              Aquí se mostrará el gráfico de estadísticas.
            </Text>
          </Box>
        </Box>
      </Flex>

      <Box
        css={{
          px: "$12",
          mt: "$8",
          height: "fit-content",
          "@xsMax": { px: "$10" },
          gap: "$6",
          overflow: "hidden",
        }}
      >
        <Text
          h3
          css={{
            color: TEXT,
            textAlign: "center",
            letterSpacing: "0.2px",
            "@lg": { textAlign: "inherit" },
          }}
        >
          Section
        </Text>
        <Flex
          direction={"column"}
          justify={"center"}
          css={{
            gap: "$8",
            flexDirection: "row",
            flexWrap: "wrap",
            "@sm": { flexWrap: "nowrap" },
            "@lg": { flexWrap: "nowrap", flexDirection: "column" },
          }}
        >
          <CardAgents />
          <CardTransactions />
        </Flex>
      </Box>
    </Flex>

    <Flex
      direction={"column"}
      justify={"center"}
      css={{
        width: "100%",
        py: "$10",
        px: "$10",
        mt: "$8",
        "@sm": { px: "$20" },
      }}
    >
      <Flex justify={"between"} wrap={"wrap"} css={{ alignItems: "center" }}>
        <Text
          h3
          css={{
            color: TEXT,
            textAlign: "center",
            letterSpacing: "0.2px",
            "@lg": { textAlign: "inherit" },
          }}
        >
          Latest Users
        </Text>

        <NextLink href="/accounts" passHref legacyBehavior>
          <Link
            block
            css={{
              color: MAGENTA,
              textUnderlineOffset: "4px",
              "&:hover": { opacity: 0.9 },
              textAlign: "center",
              "@lg": { textAlign: "inherit" },
            }}
          >
            View All
          </Link>
        </NextLink>
      </Flex>

      <Box
        css={{
          mt: "$6",
          backgroundColor: SURFACE,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "$2xl",
          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
        }}
      >
        <TableWrapper />
      </Box>
    </Flex>
  </Box>
);

export default Content;
