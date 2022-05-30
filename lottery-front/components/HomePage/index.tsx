import { Box, BoxProps, Button } from "@chakra-ui/react";
import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useReducer } from "react";
import Game from "../Game";
import { Actions, initialState, reducer } from "./reducer";

const HomePage: NextPage = () => {
  const [{ walletAddress, program }, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      // @ts-ignore
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          const response = await solana.connect({ onlyIfTrusted: true });

          dispatch({
            type: Actions.SetWalletAddress,
            payload: response.publicKey.toString(),
          });
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    //@ts-ignore
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      dispatch({
        type: Actions.SetWalletAddress,
        payload: response.publicKey.toString(),
      });
    }
  };

  return (
    <Box display="flex" flexDir="column" width="80%" margin="0 auto">
      <Head>
        <title>Lottery</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Box {...headerStyle}>
          <Box fontSize="5xl" fontWeight="bold">
            Lottery
          </Box>
          {!walletAddress ? (
            <Button
              position="absolute"
              right="0"
              onClick={() => connectWallet()}
            >
              Connect Wallet
            </Button>
          ) : null}
        </Box>
        <Game
          name="Mega Lottery"
          amount={3}
          maximum={15}
          onJoin={() => console.log("joined")}
          onLeave={() => console.log("leaved")}
        />
        <Game
          buttonStatus="leave"
          name="Mega Lottery"
          amount={3}
          maximum={15}
          onJoin={() => console.log("joined")}
          onLeave={() => console.log("leaved")}
        />
        <Game
          buttonStatus="disabled"
          name="Mega Lottery"
          amount={3}
          maximum={15}
          onJoin={() => console.log("joined")}
          onLeave={() => console.log("leaved")}
        />
      </main>
    </Box>
  );
};

const headerStyle = {
  width: "100%",
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
} as BoxProps;

export default HomePage;
