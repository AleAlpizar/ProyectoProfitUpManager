import { Avatar, Card, Text, Button as NextUIButton } from "@nextui-org/react";
import React from "react";
import { Box } from "../styles/box";
import { Flex } from "../styles/flex";

const pictureUsers = [
  "https://i.pravatar.cc/150?u=a042581f4e29026024d",
  "https://i.pravatar.cc/150?u=a042581f4e29026704d",
  "https://i.pravatar.cc/150?u=a04258114e29026702d",
  "https://i.pravatar.cc/150?u=a048581f4e29026701d",
  "https://i.pravatar.cc/150?u=a092581d4ef9026700d",
];

export const CardAgents: React.FC<{
  title?: string;
  subtitle?: string;
  total?: number;
  onPrimary?: () => void;
}> = ({
  title = "Agents",
  subtitle = "Conoce a tus agentes y sus rankings para obtener mejores resultados",
  total = 12,
  onPrimary,
}) => {
  return (
    <Card
      variant="flat"
      css={{
        mw: "400px",
        h: "280px",
        px: "$6",
        bg: "#121618",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "$xl",
        boxShadow: "0 20px 60px rgba(0,0,0,.45)",
      }}
    >
      <Card.Body
        css={{
          paddingTop: "40px",
          paddingBottom: "40px",
          gap: 24,
        }}
      >
        <Flex justify={"center"}>
          <Flex
            align={"center"}
            direction={"row"}
            justify={"center"}
            css={{
              gap: "$4",
              px: "$6",
              py: "$3",
              border: "1.5px dashed rgba(255,255,255,0.15)",
              borderRadius: "$lg",
              bg: "rgba(255,255,255,0.03)",
            }}
          >
            <Text css={{ color: "#A30862" }}>⭐</Text>
            <Box>
              <Flex direction={"column"}>
                <Text
                  h3
                  css={{
                    m: 0,
                    color: "#E6E9EA",
                    letterSpacing: "0.2px",
                  }}
                >
                  {title}
                </Text>
                <Text span size={"$xs"} css={{ color: "#8B9AA0", mt: "$1" }}>
                  {subtitle}
                </Text>
              </Flex>
            </Box>
          </Flex>
        </Flex>

        <Flex css={{ pt: "$2" }} align={"center"} justify={"center"}>
          <Avatar.Group count={total}>
            {pictureUsers.map((url, index) => (
              <Avatar
                key={index}
                size="lg"
                pointer
                src={url}
                bordered
                color="gradient"
                stacked
                css={{
                  borderColor: "rgba(255,255,255,0.18)",
                  boxShadow: "0 6px 18px rgba(0,0,0,.35)",
                }}
              />
            ))}
          </Avatar.Group>
        </Flex>

        <Flex align={"center"} justify={"center"} css={{ gap: "$4" }}>
          <Text size={"$xs"} css={{ color: "#8B9AA0" }}>
            {total}+ agentes disponibles
          </Text>
          {onPrimary && (
            <NextUIButton
              auto
              onPress={onPrimary}
              css={{
                px: "$8",
                h: "$10",
                bg: "#A30862",
                color: "white",
                borderRadius: "$md",
                "&:hover": { opacity: 0.95 },
              }}
            >
              Ver agentes
            </NextUIButton>
          )}
        </Flex>
      </Card.Body>
    </Card>
  );
};
