import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { assert, expect } from "chai";
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
  const player4 = anchor.web3.Keypair.generate();
  const insufficientMoneyPlayer = anchor.web3.Keypair.generate();
  const players = [player1, player2, player3, player4, insufficientMoneyPlayer];

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
        lottery.publicKey,
        4 * LAMPORTS_PER_SOL
      )
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        players[0].publicKey,
        5 * LAMPORTS_PER_SOL
      )
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        players[1].publicKey,
        5 * LAMPORTS_PER_SOL
      )
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        players[2].publicKey,
        5 * LAMPORTS_PER_SOL
      )
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        players[3].publicKey,
        5 * LAMPORTS_PER_SOL
      )
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        players[4].publicKey,
        2 * LAMPORTS_PER_SOL
      )
    );
  });

  it("Creates a lottery account", async () => {
    await program.methods
      .initializeLottery(new anchor.BN(3), new anchor.BN(3 * LAMPORTS_PER_SOL), oracle.publicKey)
      .accounts({
        lottery: lottery.publicKey,
        admin: lottery_admin.publicKey,
        systemProgram: SystemProgram.programId,
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
    let startBalance: number = await provider.connection.getBalance(
        players[0].publicKey
    );
    const idx: number = (await program.account.lottery.fetch(lottery.publicKey))
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
        player: players[0].publicKey,
        ticket,
        systemProgram: SystemProgram.programId,
      })
      .signers([players[0]])
      .rpc();

    const lotteryState = await program.account.lottery.fetch(lottery.publicKey);
    expect(lotteryState.playersAmount).to.equal(idx + 1);

    const ticketState = await program.account.ticket.fetch(ticket);
    expect(ticketState.submitter.toString()).to.equal(
      players[0].publicKey.toString()
    );
    expect(ticketState.isActive).to.be.true;
    let endBalanace = await provider.connection.getBalance(players[0].publicKey);
    expect(endBalanace).to.be.lessThan(startBalance);
  });

  it("Player 5 unable to join the lottery because of insufficient funds", async () => {
    let idx: number = (await program.account.lottery.fetch(lottery.publicKey))
        .playersAmount;
    const buf = Buffer.alloc(4);
    buf.writeUIntBE(idx, 0, 4);
    const [ticket] = await anchor.web3.PublicKey.findProgramAddress(
        [buf, lottery.publicKey.toBytes()],
        program.programId
    );
    try {
      await program.methods
          .join()
          .accounts({
            lottery: lottery.publicKey,
            player: players[4].publicKey,
            ticket,
            systemProgram: SystemProgram.programId,
          })
          .signers([players[4]])
          .rpc();
      assert.fail();
    } catch (e) {
      expect(e.message).to.be.equal("2003: A raw constraint was violated");
      const lotteryState = await program.account.lottery.fetch(
          lottery.publicKey
      );
      expect(lotteryState.playersAmount).to.equal(idx);
    }
  });

  it("Player 2 and 3 joins the game", async () => {
    let idx: number = (await program.account.lottery.fetch(lottery.publicKey))
      .playersAmount;
    const buf2 = Buffer.alloc(4);
    buf2.writeUIntBE(idx, 0, 4);
    const [ticket2] = await anchor.web3.PublicKey.findProgramAddress(
      [buf2, lottery.publicKey.toBytes()],
      program.programId
    );
    await program.methods
      .join()
      .accounts({
        lottery: lottery.publicKey,
        player: players[1].publicKey,
        ticket: ticket2,
        systemProgram: SystemProgram.programId,
      })
      .signers([players[1]])
      .rpc();

    let lotteryState = await program.account.lottery.fetch(lottery.publicKey);
    expect(lotteryState.playersAmount).to.equal(idx + 1);

    const ticket2State = await program.account.ticket.fetch(ticket2);
    expect(ticket2State.submitter.toString()).to.equal(
      players[1].publicKey.toString()
    );
    expect(ticket2State.isActive).to.be.true;

    idx = (await program.account.lottery.fetch(lottery.publicKey))
      .playersAmount;
    const buf3 = Buffer.alloc(4);
    buf3.writeUIntBE(idx, 0, 4);
    const [ticket3] = await anchor.web3.PublicKey.findProgramAddress(
      [buf3, lottery.publicKey.toBytes()],
      program.programId
    );
    await program.methods
      .join()
      .accounts({
        lottery: lottery.publicKey,
        player: players[2].publicKey,
        ticket: ticket3,
        systemProgram: SystemProgram.programId,
      })
      .signers([players[2]])
      .rpc();

    lotteryState = await program.account.lottery.fetch(lottery.publicKey);
    expect(lotteryState.playersAmount).to.equal(idx + 1);

    const ticket3State = await program.account.ticket.fetch(ticket3);
    expect(ticket3State.submitter.toString()).to.equal(
      players[2].publicKey.toString()
    );
    expect(ticket3State.isActive).to.be.true;
  });
  it("Player 4 can't join", async () => {
    let idx: number = (await program.account.lottery.fetch(lottery.publicKey))
      .playersAmount;
    const buf = Buffer.alloc(4);
    buf.writeUIntBE(idx, 0, 4);
    const [ticket] = await anchor.web3.PublicKey.findProgramAddress(
      [buf, lottery.publicKey.toBytes()],
      program.programId
    );
    try {
      await program.methods
        .join()
        .accounts({
          lottery: lottery.publicKey,
          player: players[3].publicKey,
          ticket,
          systemProgram: SystemProgram.programId,
        })
        .signers([players[3]])
        .rpc();
      assert.fail();
    } catch (e) {
      expect(e.message).to.be.equal("6001: LobbyIsFull");
      const lotteryState = await program.account.lottery.fetch(
        lottery.publicKey
      );
      expect(lotteryState.playersAmount).to.equal(idx);
      expect(lotteryState.playersAmount == lotteryState.playersMaximum).to.be
        .true;
    }
  });
  it("Player 3 leaves the game", async () => {
    const idx = 2;
    const buf = Buffer.alloc(4);
    buf.writeUIntBE(idx, 0, 4);
    const [ticket] = await anchor.web3.PublicKey.findProgramAddress(
      [buf, lottery.publicKey.toBytes()],
      program.programId
    );
    await program.methods
      .leave()
      .accounts({
        lottery: lottery.publicKey,
        player: players[2].publicKey,
        ticket,
      })
      .signers([players[2]])
      .rpc();

    const lotteryState = await program.account.lottery.fetch(lottery.publicKey);
    expect(lotteryState.playersAmount).to.equal(idx);
    const ticketState = await program.account.ticket.fetch(ticket);
    expect(ticketState.isActive).to.be.false;
  });
  it("Oracle picks winner", async () => {
    let winnerIndex: number = 1;

    // Get oracle picks winner index
    await program.methods
      .pickWinner()
      .accounts({
        lottery: lottery.publicKey,
        oracle: oracle.publicKey,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .signers([oracle])
      .rpc();

    // Assert that the winner index has been picked
    let lotteryState = await program.account.lottery.fetch(lottery.publicKey);
    expect(lotteryState.winnerIndex).to.be.lessThanOrEqual(lotteryState.playersAmount - 1);
    expect(lotteryState.winnerIndex).to.be.greaterThanOrEqual(0);
  });
  it("Winner withdraws funds", async () => {
    // Get winner idx
    const winnerIdx: number = (
        await program.account.lottery.fetch(lottery.publicKey)
    ).winnerIndex;

    let startBalance: number = await provider.connection.getBalance(
      players[winnerIdx].publicKey
    );

    const buf = Buffer.alloc(4);
    buf.writeUIntBE(winnerIdx, 0, 4);

    const [ticket] = await anchor.web3.PublicKey.findProgramAddress(
      [buf, lottery.publicKey.toBytes()],
      program.programId
    );

    // Get lottery ticket
    await program.methods
      .payOutWinner()
      .accounts({
        ticket,
        lottery: lottery.publicKey,
        winner: players[winnerIdx].publicKey,
      })
      .signers([])
      .rpc();

      let endBalanace = await provider.connection.getBalance(players[winnerIdx].publicKey);
      expect(endBalanace).to.be.greaterThan(startBalance);
  });
});
