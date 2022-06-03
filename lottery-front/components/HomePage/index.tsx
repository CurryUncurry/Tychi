import { Box, BoxProps } from "@chakra-ui/react";
import {
  Program,
  Idl,
  AnchorProvider,
  web3,
  Provider,
  getProvider,
  setProvider,
} from "@project-serum/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useReducer } from "react";
import { env } from "../../env/config";
import Game from "../Game";
import { Actions, initialState, reducer } from "./reducer";
import idl from "../../accounts/idl.json";
import { getRandomEmoji } from "../../helpers/randomEmoji";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";

interface IProps {
  publicKeys: string[];
}

const HomePage: NextPage<IProps> = ({ publicKeys }) => {
  const [{ program, lotteries }, dispatch] = useReducer(reducer, initialState);
  const wallet = useWallet();

  useEffect(() => {
    const onLoad = async () => {
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

  const setupProgram = () => {
    const connection = new Connection(env.cluster);
    // @ts-ignore
    const provider = new AnchorProvider(connection, window.solana, {
      preflightCommitment: "processed",
    });
    setProvider(provider);

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
          payload: {
            ...lottery,
            name: `${getRandomEmoji()} Lottery`,
            publicKey,
          },
        });
      })
    );
  };

  const onJoin = async (lotteryPublicKey: string) => {
    const lotteryPk = new PublicKey(lotteryPublicKey);
    const idx: number = (await program.account.lottery.fetch(lotteryPk))
      .playersAmount;
    const buf = Buffer.alloc(4);
    buf.writeUIntBE(idx, 0, 4);
    const [ticket] = await web3.PublicKey.findProgramAddress(
      [buf, lotteryPk.toBytes()],
      program.programId
    );
    const tx = await program.transaction.join({
      accounts: {
        lottery: lotteryPk,
        player: wallet.publicKey,
        ticket,
        systemProgram: SystemProgram.programId,
      },
      signers: [wallet],
    });
    const connection = new Connection(env.cluster);
    tx.feePayer = wallet.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    // @ts-ignore
    const signedTx = await wallet.signTransaction(tx);
    const txId = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(txId);
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
          <Box position="absolute" right={0}>
            {!wallet.connected ? (
              <WalletMultiButton />
            ) : (
              <WalletDisconnectButton />
            )}
          </Box>
        </Box>
        {Object.entries(lotteries).map(
          ([publicKey, { name, playersAmount, playersMaximum }]) => (
            <Game
              mb={3}
              buttonStatus={!wallet.connected ? "disabled" : "join"}
              publicKey={publicKey}
              name={name}
              amount={playersAmount}
              maximum={playersMaximum}
              onJoin={onJoin}
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
  mb: 5,
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
} as BoxProps;

export default HomePage;
