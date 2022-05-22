import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Lottery } from "../target/types/lottery";
const { SystemProgram } = anchor.web3;

describe("lottery", () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const LAMPORTS_PER_SOL = 1000000000;

  const lottery = anchor.web3.Keypair.generate();
  const lottery_admin = anchor.web3.Keypair.generate();
  const player1 = anchor.web3.Keypair.generate();
  const player2 = anchor.web3.Keypair.generate();
  const player3 = anchor.web3.Keypair.generate();
  const oracle = anchor.web3.Keypair.generate();

  const program = anchor.workspace.Lottery as Program<Lottery>;

  before(async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        lottery_admin.publicKey,
        5 * LAMPORTS_PER_SOL
      )
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        player1.publicKey,
        LAMPORTS_PER_SOL
      )
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        player2.publicKey,
        LAMPORTS_PER_SOL
      )
    )
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        player3.publicKey,
        LAMPORTS_PER_SOL
      )
    )

  })

  it("Creates a lottery account", async () => {
    await program.methods
    .initializeLottery(new anchor.BN(3), oracle.publicKey)
    .accounts({
      lottery: lottery.publicKey,
      admin: lottery_admin.publicKey,
      systemProgram: SystemProgram.programId
    })
    .signers([lottery, lottery_admin])
    .rpc()
  });
  // it("Player 1 joins the game", async () => {

  // });
  // it("Player 2 and 3 joins the game", async () => {});
  // it("Player 3 leaves the game", async () => {});
  // it("Oracle picks winner", async () => {});
  // it("Winner withdraws funds", async () => {});
});
