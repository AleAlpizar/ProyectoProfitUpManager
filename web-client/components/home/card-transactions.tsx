import { Avatar, Card, Text } from "@nextui-org/react";
import React from "react";
import { Box } from "../styles/box";
import { Flex } from "../styles/flex";

type Txn = {
  id: string | number;
  name: string;
  avatar: string;
  amount: string | number;     
  currency?: string;            
  date: string;                 
};

type Props = {
  title?: string;
  subtitle?: string;
  maxHeight?: number | string;  
  transactions?: Txn[];
};

const MAGENTA = "#A30862";
const LIMA = "#95B64F";
const VINO = "#6C0F1C";
const BG = "#121618";
const TEXT = "#E6E9EA";
const MUTED = "#8B9AA0";

const toNumber = (v: string | number) =>
  typeof v === "number" ? v : Number(String(v).replace(/[^\d.-]/g, ""));

export const CardTransactions: React.FC<Props> = ({
  title = "Latest Transactions",
  subtitle = "Movimientos recientes",
  maxHeight = 360,
  transactions = [
    { id: 1, name: "Jose Perez",   avatar: "https://i.pravatar.cc/150?u=1", amount: 4500,  currency: "USD", date: "9/20/2021" },
    { id: 2, name: "Andrew Steven",avatar: "https://i.pravatar.cc/150?u=2", amount: 4500,  currency: "USD", date: "9/20/2021" },
    { id: 3, name: "Ruben Garcia", avatar: "https://i.pravatar.cc/150?u=3", amount: 1500,  currency: "USD", date: "2/20/2022" },
    { id: 4, name: "Perla Garcia", avatar: "https://i.pravatar.cc/150?u=4", amount: 200,   currency: "USD", date: "3/20/2022" },
    { id: 5, name: "Mathew Funez", avatar: "https://i.pravatar.cc/150?u=5", amount: 2444,  currency: "USD", date: "5/20/2022" },
    { id: 6, name: "Carlos Diaz",  avatar: "https://i.pravatar.cc/150?u=6", amount: 3000,  currency: "USD", date: "12/20/2022" },
  ],
}) => {
  return (
    <Card
      isBlurred
      variant="flat"
      css={{
        mw: "420px",
        h: "auto",
        px: "$6",
        borderRadius: "$xl",
        bg: BG,
        border: "1px solid rgba(255,255,255,0.08)",
        shadow: "0 20px 60px rgba(0,0,0,.45)",
      }}
    >
      <Card.Body css={{ py: "$8", gap: "$6" }}>
        <Flex justify={"center"}>
          <Flex
            align={"center"}
            direction={"row"}
            justify={"center"}
            css={{
              gap: "$4",
              px: "$6",
              py: "$3",
              border: "1px dashed rgba(255,255,255,0.15)",
              borderRadius: "$lg",
              bg: "rgba(255,255,255,0.03)",
            }}
          >
            <Text css={{ color: MAGENTA }}>💳</Text>
            <Box>
              <Flex direction={"column"} css={{ ai: "center" }}>
                <Text h3 css={{ m: 0, color: TEXT, letterSpacing: "0.2px" }}>
                  {title}
                </Text>
                <Text span size={"$xs"} css={{ color: MUTED }}>
                  {subtitle}
                </Text>
              </Flex>
            </Box>
          </Flex>
        </Flex>

        <Box
          css={{
            maxH: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
            overflowY: "auto",
            pr: "$2",
          }}
        >
          <Flex direction={"column"} css={{ gap: "$2" }}>
            {transactions.map((t, idx) => {
              const n = toNumber(t.amount);
              const positive = n >= 0;
              const color = positive ? LIMA : VINO;
              const sign = positive ? "" : "-";
              const display =
                typeof t.amount === "string" && /[a-zA-Z]/.test(t.amount)
                  ? t.amount
                  : `${sign}${Math.abs(n).toLocaleString()} ${t.currency ?? "USD"}`;

              return (
                <Flex
                  key={t.id ?? idx}
                  align={"center"}
                  css={{
                    gap: "$6",
                    py: "$3",
                    borderBottom: idx === transactions.length - 1 ? "none" : "1px solid rgba(255,255,255,0.08)",
                    "&:hover": { bg: "rgba(255,255,255,0.04)" },
                    transition: "background 120ms ease",
                    px: "$2",
                    borderRadius: "$sm",
                  }}
                >
                  <Avatar
                    size="lg"
                    pointer
                    src={t.avatar}
                    bordered
                    color="gradient"
                    stacked={false}
                    css={{ borderColor: "rgba(255,255,255,0.18)" }}
                  />
                  <Flex css={{ gap: "$1", minWidth: 0 }} direction={"column"}>
                    <Text span size={"$sm"} css={{ color: TEXT, fw: "600", truncate: true }}>
                      {t.name}
                    </Text>
                    <Text span size={"$xs"} css={{ color: MUTED }}>
                      {t.date}
                    </Text>
                  </Flex>
                  <Box css={{ ml: "auto" }}>
                    <Text span size={"$sm"} css={{ color, fw: "600" }}>
                      {display}
                    </Text>
                  </Box>
                </Flex>
              );
            })}
          </Flex>
        </Box>
      </Card.Body>
    </Card>
  );
};
