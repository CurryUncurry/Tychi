import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { expect } from "chai";
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
    .rpc();
    let lotteryState = await program.account.lottery.fetch(lottery.publicKey);

    expect(lotteryState.playersAmount).to.equal(0);

    expect(lotteryState.authority.toString()).to.equal(
      lottery_admin.publicKey.toString()
    );

    expect(lotteryState.playersMaximum).to.equal(3);

  });

  it("Player 1 joins the game", async () => {

    let idx: number = (await program.account.lottery.fetch(lottery.publicKey))
      .playersAmount;
    const buf = Buffer.alloc(4);
    buf.writeUIntBE(idx, 0, 4);
    const [ticket, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [buf, lottery.publicKey.toBytes()],
      program.programId
    );
    await program.methods
    .join()
    .accounts({
      lottery: lottery.publicKey,
      player: player1.publicKey,
      ticket,
      systemProgram: SystemProgram.programId
    })
    .signers([player1])
    .rpc();

    let lotteryState = await program.account.lottery.fetch(lottery.publicKey);
    expect(lotteryState.playersAmount).to.equal(idx + 1);

    let ticketState = await program.account.ticket.fetch(ticket);
    expect(ticketState.submitter.toString()).to.equal(
      player1.publicKey.toString()
    );
    expect(ticketState.isActive).to.be.true;
  });

  
  // it("Player 2 and 3 joins the game", async () => {});
  // it("Player 3 leaves the game", async () => {});
  // it("Oracle picks winner", async () => {});
  // it("Winner withdraws funds", async () => {});
});
