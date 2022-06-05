import { Idl, Program } from "@project-serum/anchor";

export enum Actions {
  SetProgram,
  AddLottery,
  SetJoined,
  UpdateLoading,
}

export const initialState = {
  lotteries: {},
};

interface IState {
  program?: Program<Idl>;
  lotteries: {
    [key: string]: {
      name: string;
      playersAmount: number;
      playersMaximum: number;
      isJoined: boolean;
      isLoading: boolean;
    };
  };
}

export const reducer = (
  state: IState,
  { type, payload }: { type: Actions; payload: any }
) => {
  switch (type) {
    case Actions.SetProgram:
      return { ...state, program: payload };
    case Actions.AddLottery: {
      const { playersAmount, playersMaximum, name, publicKey } = payload;
      const { lotteries } = { ...state };
      lotteries[publicKey] = {
        playersAmount,
        playersMaximum,
        name,
        isJoined: false,
        isLoading: false,
      };
      return { ...state, lotteries };
    }
    case Actions.SetJoined: {
      const { publicKey } = payload;
      const { lotteries } = { ...state };
      lotteries[publicKey] = { ...lotteries[publicKey], isJoined: true };
      return { ...state, lotteries };
    }
    case Actions.UpdateLoading: {
      const { publicKey, isLoading } = payload;
      const { lotteries } = { ...state };
      lotteries[publicKey] = { ...lotteries[publicKey], isLoading };
      return { ...state, lotteries };
    }
    default:
      throw new Error();
  }
};
