import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Lottery } from "../target/types/lottery";

describe("lottery", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Lottery as Program<Lottery>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
