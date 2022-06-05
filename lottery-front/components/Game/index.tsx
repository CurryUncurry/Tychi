import { Box, BoxProps, Button, Spinner } from "@chakra-ui/react";
import { FC } from "react";

interface IProps {
  buttonStatus?: "join" | "disabled" | "leave" | "loading";
  amount: number;
  maximum: number;
  name?: string;
  publicKey: string;
  onJoin: (pk: string) => void;
  onLeave: (pk: string) => void;
}

const Game: FC<IProps & BoxProps> = ({
  buttonStatus = "join",
  amount,
  name,
  maximum,
  publicKey,
  onJoin,
  onLeave,
  ...rest
}) => {
  const getButton = () => {
    switch (buttonStatus) {
      case "disabled":
      case "join":
        return (
          <Button
            mb="1"
            disabled={buttonStatus == "disabled"}
            onClick={() => onJoin(publicKey)}
            {...buttonStyle}
          >
            Join
          </Button>
        );
      case "leave":
        return (
          <Button mb="1" onClick={() => onLeave(publicKey)} {...buttonStyle}>
            Leave
          </Button>
        );
      case "loading":
        return (
          <Button mb="1" {...buttonStyle}>
            <Spinner />
          </Button>
        );
    }
  };

  return (
    <Box {...gameStyle} {...rest}>
      <Box fontSize="xl">{name}</Box>
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        {getButton()}
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
const buttonStyle = {
  height: "40px",
  width: "100px",
};

export default Game;
