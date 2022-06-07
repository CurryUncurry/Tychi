import { Box, BoxProps } from "@chakra-ui/react";
import {
  Program,
  Idl,
  AnchorProvider,
  web3,
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
import { createTicket } from "../../helpers/ticketHelper";

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

  useEffect(() => {
    if (wallet && program) {
      checkIsJoinedToLottery();
    }
  }, [wallet, program]);

  const setupProgram = () => {
    const connection = new Connection(env.cluster);
    // @ts-ignore
    const provider = new AnchorProvider(connection, window.solana, {
      preflightCommitment: "processed",
      commitment: "processed"
    });
    setProvider(provider);

    const programId = new PublicKey(idl.metadata.address);
    const program = new Program(idl as Idl, programId, provider);
    dispatch({ type: Actions.SetProgram, payload: program });
  };

  const setupLotteries = async () => {
    await Promise.all(
      publicKeys.map(async (publicKey) => {
        try {
          const lottery = await program.account.lottery.fetch(publicKey);
          dispatch({
            type: Actions.AddLottery,
            payload: {
              ...lottery,
              name: `${getRandomEmoji()} Lottery`,
              publicKey,
            },
          });
        } catch (e) {}
      })
    );
  };

  const checkIsJoinedToLottery = async () => {
    await Promise.all(
      publicKeys.map(async (publicKey) => {
        const lotteryPk = new PublicKey(publicKey);
        try {
          const lottery = await program.account.lottery.fetch(publicKey);
          await Promise.all(
            [...new Array(lottery.playersMaximum)].map(async (_e, i) => {
              const ticket = await createTicket(i, lotteryPk, program.programId);
              try {
                const { isActive, submitter } =
                  await program.account.ticket.fetch(ticket);
  
                const submitterPk = new PublicKey(submitter);
                if (
                  isActive == true &&
                  submitterPk.toString() == wallet.publicKey!.toString()
                ) {
                  dispatch({ type: Actions.SetJoined, payload: { publicKey } });
                }
              } catch (e) {}
            })
          );
        } catch (e) {}
      })
    );
  };

  const onJoin = async (lotteryPublicKey: string) => {
    const lotteryPk = new PublicKey(lotteryPublicKey);
    const { playersAmount } = await program.account.lottery.fetch(lotteryPk);
    const userTicket = await createTicket(playersAmount, lotteryPk, program.programId);
    try {
      dispatch({
        type: Actions.UpdateLoading,
        payload: { publicKey: lotteryPublicKey, isLoading: true },
      });
      const tx = await program.transaction.join({
        accounts: {
          lottery: lotteryPk,
          player: wallet.publicKey,
          ticket: userTicket,
          systemProgram: SystemProgram.programId,
        },
        signers: [wallet],
      });
      const connection = new Connection(env.cluster);
      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      // @ts-ignore
      const signedTx = await wallet.signTransaction(tx);
      const txId = await connection.sendRawTransaction(signedTx.serialize());

      await connection.confirmTransaction({
        signature: txId,
        blockhash,
        lastValidBlockHeight,
      });
      await setupLotteries();
      await checkIsJoinedToLottery();
    } catch (e) {
    } finally {
      dispatch({
        type: Actions.UpdateLoading,
        payload: { publicKey: lotteryPublicKey, isLoading: false },
      });
    }
  };

  const onLeave = async (lotteryPublicKey: string) => {
    const lotteryPk = new PublicKey(lotteryPublicKey);
    const { playersMaximum } = await program.account.lottery.fetch(lotteryPk);

    const userTicket = await (
      await Promise.all(
        [...new Array(playersMaximum)].map(async (_e, i) => {
          const ticket = await createTicket(i, lotteryPk, program.programId);
          try {
            const { isActive, submitter } = await program.account.ticket.fetch(
              ticket
            );

            const submitterPk = new PublicKey(submitter);
            if (
              isActive == true &&
              submitterPk.toString() == wallet.publicKey!.toString()
            ) {
              return ticket;
            }
          } catch (e) {
            return false;
          }
        })
      )
    ).filter((e) => e)[0];
    try {
      dispatch({
        type: Actions.UpdateLoading,
        payload: { publicKey: lotteryPublicKey, isLoading: true },
      });
      const tx = await program.transaction.leave({
        accounts: {
          lottery: lotteryPk,
          player: wallet.publicKey,
          ticket: userTicket,
        },
        signers: [wallet],
      });
      const connection = new Connection(env.cluster);
      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      // @ts-ignore
      const signedTx = await wallet.signTransaction(tx);
      const txId = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction({
        signature: txId,
        blockhash,
        lastValidBlockHeight,
      });
      await setupLotteries();
      await checkIsJoinedToLottery();
    } catch (e) {
    } finally {
      dispatch({
        type: Actions.UpdateLoading,
        payload: { publicKey: lotteryPublicKey, isLoading: false },
      });
    }
  };

  const onReceive = async (lotteryPublicKey: string) => {
    const lotteryPk = new PublicKey(lotteryPublicKey);
    const { winnerIndex } = await program.account.lottery.fetch(lotteryPk);
    const userTicket = await createTicket(winnerIndex, lotteryPk, program.programId)
    try {
      dispatch({
        type: Actions.UpdateLoading,
        payload: { publicKey: lotteryPublicKey, isLoading: true },
      });
      const tx = await program.transaction.payOutWinner({
        accounts: {
          lottery: lotteryPk,
          ticket: userTicket,
          winner: wallet.publicKey
        },
        signers: [],
      });
      const connection = new Connection(env.cluster);
      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      // @ts-ignore
      const signedTx = await wallet.signTransaction(tx);
      const txId = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction({
        signature: txId,
        blockhash,
        lastValidBlockHeight,
      });
      await setupLotteries();
    } catch (e) {
      console.log(e)
    } finally {
      dispatch({
        type: Actions.UpdateLoading,
        payload: { publicKey: lotteryPublicKey, isLoading: false },
      });
    }
  }

  const getButtonStatus = (isConnected: boolean, key: string) => {
    if (lotteries[key].isLoading) {
      return "loading";
    }
    if (lotteries[key].winner && lotteries[key].winner == wallet.publicKey?.toString() && !lotteries[key].isPaid) {
      return "receive";
    }
    if (!isConnected || lotteries[key].winner || lotteries[key].playersAmount == lotteries[key].playersMaximum || lotteries[key].isPaid) {
      return "disabled";
    }
    if (lotteries[key].isJoined) {
      return "leave";
    }
    return "join";
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
          ([publicKey, { name, playersAmount, playersMaximum, winner }], i) => (
            <Game
              key={i}
              mb={3}
              buttonStatus={getButtonStatus(wallet.connected, publicKey)}
              publicKey={publicKey}
              name={name}
              amount={playersAmount}
              maximum={playersMaximum}
              winner={winner}
              onJoin={onJoin}
              onLeave={onLeave}
              onReceive={onReceive}
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
