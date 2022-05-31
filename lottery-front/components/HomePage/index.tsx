import { Box, BoxProps, Button } from "@chakra-ui/react";
import { Program, Idl, AnchorProvider } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useReducer } from "react";
import { env } from "../../env/config";
import Game from "../Game";
import { Actions, initialState, reducer } from "./reducer";
import idl from "../../accounts/idl.json";
import { getRandomEmoji } from "../../helpers/randomEmoji";

interface IProps {
  publicKeys: string[];
}

const HomePage: NextPage<IProps> = ({ publicKeys }) => {
  const [{ walletAddress, program, lotteries }, dispatch] = useReducer(
    reducer,
    initialState
  );

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
      await setupProgram();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (program) {
      setupLotteries();
    }
  }, [program]);

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

  const setupProgram = () => {
    const connection = new Connection(env.cluster);
    // @ts-ignore
    const provider = new AnchorProvider(connection, window.solana, {
      preflightCommitment: "processed",
    });

    const programId = new PublicKey(idl.metadata.address);
    const program = new Program(idl as Idl, programId, provider);
    dispatch({ type: Actions.SetProgram, payload: program });
  };

  const setupLotteries = async () => {
    Promise.all(
      publicKeys.map(async (publicKey) => {
        const lottery = await program.account.lottery.fetch(publicKey);
        dispatch({
          type: Actions.AddLottery,
          payload: { ...lottery, name: `${getRandomEmoji()} Lottery`, publicKey },
        });
      })
    );
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
        {Object.values(lotteries).map(
          ({ name, playersAmount, playersMaximum }) => (
            <Game
              name={name}
              amount={playersAmount}
              maximum={playersMaximum}
              onJoin={() => console.log("joined")}
              onLeave={() => console.log("leaved")}
            />
          )
        )}
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
