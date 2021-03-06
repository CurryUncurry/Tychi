import { Box, BoxProps, Button, Spinner } from "@chakra-ui/react";
import { FC } from "react";

interface IProps {
  buttonStatus?: "join" | "disabled" | "leave" | "loading" | "receive";
  amount: number;
  maximum: number;
  name?: string;
  publicKey: string;
  winner?: string;
  onJoin: (pk: string) => void;
  onLeave: (pk: string) => void;
  onReceive: (pk: string) => void;
}

const Game: FC<IProps & BoxProps> = ({
  buttonStatus = "join",
  amount,
  name,
  maximum,
  publicKey,
  winner,
  onJoin,
  onLeave,
  onReceive,
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
      case "receive":
        return (
          <Button mb="1" onClick={() => onReceive(publicKey)} {...buttonStyle}>
            Receive
          </Button>
        );
    }
  };

  return (
    <Box {...rest} {...gameWrapperStyle}>
      <Box {...gameStyle}>
        <Box fontSize="2xl">{name} {winner ? (<Box fontWeight="bold">Finished</Box>) : null}</Box>
        {winner ? (<Box>{winner}</Box>) : null}
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
    </Box>
  );
};

const gameStyle = {
  background: "white",
  display: "flex",
  padding: "16px",
  justifyContent: "space-between",
  alignItems: "center",
  border: "3px solid #ADD8E6",
  borderRadius: "16px",
  width: "100%",
};

const gameWrapperStyle = {
  background: '#ADD8E6',
  borderRadius: "16px",
  paddingBottom: "5px"
}

const buttonStyle = {
  height: "40px",
  width: "100px",
};

export default Game;
