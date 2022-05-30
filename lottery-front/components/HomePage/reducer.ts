import { AnchorProvider, Idl, Program } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { env } from "../../env/config";
import idl from "../../accounts/idl.json";

export enum Actions {
  SetWalletAddress,
}

const connection = new Connection(env.cluster);
// @ts-ignore
const provider = new AnchorProvider(connection, window.solana, {
  preflightCommitment: "processed",
});

const programId = new PublicKey(idl.metadata.address);
const program = new Program(idl as Idl, programId, provider);

export const initialState = {
  walletAddress: "",
  program,
};

interface IState {
  walletAddress: string,
  program: Program<Idl>
}

export const reducer = (
  state: IState,
  { type, payload }: { type: Actions; payload: any }
) => {
  switch (type) {
    case Actions.SetWalletAddress:
      return { ...state, walletAddress: payload };
    default:
      throw new Error();
  }
};
