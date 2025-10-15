import { Card, Text } from "@nextui-org/react";
import React from "react";
import { Community } from "../icons/community";
import { Box } from "../styles/box";
import { Flex } from "../styles/flex";

type Props = {
  title?: string;            // "Health Insurance"
  subtitle?: string;         // "+2400 People"
  amount?: string;           // "$12,138"
  delta?: string;            // "+ 4.5%" | "- 3.1%"
  deltaPositive?: boolean;   // true -> lima; false -> vino
  downLabel?: string;        // "11,930 USD"
  upLabel?: string;          // "54,120 USD"
  vipLabel?: string;         // "150 VIP"
};

export const CardBalance2: React.FC<Props> = ({
  title = "Health Insurance",
  subtitle = "+2400 People",
  amount = "$12,138",
  delta = "+ 4.5%",
  deltaPositive = false,
  downLabel = "11,930 USD",
  upLabel = "54,120 USD",
  vipLabel = "150 VIP",
}) => {
  // Colores de la paleta
  const MAGENTA = "#A30862";
  const LIMA = "#95B64F";
  const VINO = "#6C0F1C";
  const BG = "#121618";
  const TEXT = "#E6E9EA";
  const MUTED = "#8B9AA0";

  return (
    <Card
      isBlurred
      variant="flat"
      css={{
        mw: "400px",
        px: "$6",
        borderRadius: "$xl",
        bg: BG,
        border: "1px solid rgba(255,255,255,0.08)",
        shadow: "0 20px 60px rgba(0,0,0,.45)",
      }}
    >
      <Card.Body css={{ py: "$10", gap: "$6" }}>
        {/* Header */}
        <Flex css={{ gap: "$5" }}>
          <Community color={MAGENTA} />
          <Flex direction={"column"}>
            <Text span css={{ color: TEXT, letterSpacing: "0.2px" }}>
              {title}
            </Text>
            <Text span css={{ color: MUTED }} size={"$xs"}>
              {subtitle}
            </Text>
          </Flex>
        </Flex>

        {/* Amount + delta */}
        <Flex css={{ gap: "$6", py: "$4" }} align={"center"}>
          <Text span size={"$xl"} css={{ color: TEXT }} weight={"semibold"}>
            {amount}
          </Text>
          <Text
            span
            size={"$xs"}
            css={{ color: deltaPositive ? LIMA : VINO }}
            weight={"semibold"}
          >
            {delta}
          </Text>
        </Flex>

        {/* Stats row */}
        <Flex css={{ gap: "$12" }} align={"center"}>
          <Box>
            <Text span size={"$xs"} css={{ color: LIMA }} weight={"semibold"}>
              ↓
            </Text>
            <Text span size={"$xs"} css={{ color: TEXT }}>
              {downLabel}
            </Text>
          </Box>

          <Box>
            <Text span size={"$xs"} css={{ color: VINO }} weight={"semibold"}>
              ↑
            </Text>
            <Text span size={"$xs"} css={{ color: TEXT }}>
              {upLabel}
            </Text>
          </Box>

          <Box>
            <Text span size={"$xs"} css={{ color: MAGENTA }} weight={"semibold"}>
              ⭐
            </Text>
            <Text span size={"$xs"} css={{ color: TEXT }}>
              {vipLabel}
            </Text>
          </Box>
        </Flex>
      </Card.Body>
    </Card>
  );
};
