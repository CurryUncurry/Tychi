import { Box, BoxProps, Button } from "@chakra-ui/react";
import { FC } from "react";

interface IProps {
  buttonStatus?: "join" | "disabled" | "leave";
  amount: number;
  maximum: number;
  name?: string;
  onJoin: () => void;
  onLeave: () => void;
}

const Game: FC<IProps & BoxProps> = ({
  buttonStatus = "join",
  amount,
  name,
  maximum,
  onJoin,
  onLeave,
  ...rest
}) => {
  return (
    <Box {...gameStyle} {...rest}>
      <Box fontSize="xl">{name}</Box>
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <Button mb="1" disabled={buttonStatus == "disabled"}>
          {buttonStatus !== "leave" ? "Join" : "Leave"}
        </Button>
        {amount}/{maximum}
      </Box>
    </Box>
  );
};

const gameStyle = {
  display: "flex",
  padding: "16px",
  justifyContent: "space-between",
  alignItems: "center",
  border: "1px solid #ADD8E6",
  borderRadius: "16px",
  width: "100%",
};

export default Game;
