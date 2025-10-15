import { Card, Text } from "@nextui-org/react";
import React from "react";
import { Community } from "../icons/community";
import { Box } from "../styles/box";
import { Flex } from "../styles/flex";

type Props = {
  title?: string;
  subtitle?: string;     
  amount?: string;       
  delta?: string;       
  deltaPositive?: boolean;
  downLabel?: string;    
  upLabel?: string;     
  vipLabel?: string;     
};

export const CardBalance1: React.FC<Props> = ({
  title = "Auto Insurance",
  subtitle = "1311 Cars",
  amount = "$45,910",
  delta = "+ 4.5%",
  deltaPositive = true,
  downLabel = "100,930 USD",
  upLabel = "54,120 USD",
  vipLabel = "125 VIP",
}) => {
  return (
    <Card
      isBlurred
      variant="flat"
      css={{
        mw: "400px",
        px: "$6",
        borderRadius: "$xl",
        bg: "#121618",                        
        border: "1px solid rgba(255,255,255,0.08)",
        shadow: "0 20px 60px rgba(0,0,0,.45)",
      }}
    >
      <Card.Body css={{ py: "$10", gap: "$6" }}>
        <Flex css={{ gap: "$5" }}>
          <Community />
          <Flex direction={"column"}>
            <Text span css={{ color: "#E6E9EA", letterSpacing: "0.2px" }}>
              {title}
            </Text>
            <Text span css={{ color: "#8B9AA0" }} size={"$xs"}>
              {subtitle}
            </Text>
          </Flex>
        </Flex>

        <Flex css={{ gap: "$6", py: "$4" }} align={"center"}>
          <Text span size={"$xl"} css={{ color: "white" }} weight={"semibold"}>
            {amount}
          </Text>
          <Text
            span
            size={"$xs"}
            css={{ color: deltaPositive ? "#95B64F" : "#EF4444" }}
          >
            {delta}
          </Text>
        </Flex>

        <Flex css={{ gap: "$12" }} align={"center"}>
          <Box>
            <Text span size={"$xs"} css={{ color: "#95B64F" }} weight={"semibold"}>
              ↓
            </Text>
            <Text span size={"$xs"} css={{ color: "#E6E9EA" }}>
              {downLabel}
            </Text>
          </Box>

          <Box>
            <Text span size={"$xs"} css={{ color: "#EF4444" }} weight={"semibold"}>
              ↑
            </Text>
            <Text span size={"$xs"} css={{ color: "#E6E9EA" }}>
              {upLabel}
            </Text>
          </Box>

          <Box>
            <Text span size={"$xs"} css={{ color: "#A30862" }} weight={"semibold"}>
              ⭐
            </Text>
            <Text span size={"$xs"} css={{ color: "#E6E9EA" }}>
              {vipLabel}
            </Text>
          </Box>
        </Flex>
      </Card.Body>
    </Card>
  );
};
