import { AnchorProvider, Idl, Program } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { env } from "../../env/config";
import idl from "../../accounts/idl.json";

export enum Actions {
  SetProgram,
  AddLottery,
}

export const initialState = {
  lotteries: {}
};

interface IState {
  program?: Program<Idl>,
  lotteries: { [key: string] :{
    name: string,
    playersAmount: number,
    playersMaximum: number,
  }}
}

export const reducer = (
  state: IState,
  { type, payload }: { type: Actions; payload: any }
) => {
  switch (type) {
    case Actions.SetProgram:
      return { ...state, program: payload };
    case Actions.AddLottery: {
      const { playersAmount, playersMaximum, name, publicKey } = payload
      const { lotteries } = { ...state };
      lotteries[publicKey] = ({ playersAmount, playersMaximum, name });
      return { ...state, lotteries }
    }
    default:
      throw new Error();
  }
};
