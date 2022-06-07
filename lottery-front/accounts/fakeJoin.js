const anchor = require("@project-serum/anchor");
const fs = require("fs");
const { AnchorProvider, Program } = require("@project-serum/anchor");
const { Keypair, Connection, PublicKey } = require("@solana/web3.js");
const { SystemProgram } = anchor.web3;
const LAMPORTS_PER_SOL = 1000000000;
const fromJsonToKeypair = (keypair) => {
  const arr = Object.values(keypair._keypair.secretKey);
  const secret = new Uint8Array(arr);
  const account = Keypair.fromSecretKey(secret);
  return account;
};

// 3TLEEkYedBR9Y8s4dWnspvg7SXM1zGC2hX9Cn8mEiLCm
const admin = fromJsonToKeypair(
  JSON.parse(fs.readFileSync(`admin.json`, "utf8"))
);
const connection = new Connection("http://127.0.0.1:8899");
const provider = new AnchorProvider(connection, new anchor.Wallet(admin), {
  preflightCommitment: "processed",
});

const programId = new PublicKey("GaYLemFsWLURxRTLHhS735SdfYBuV3v2aJshrrTmvsmU");
const idl = JSON.parse(fs.readFileSync(`idl.json`, "utf8"));
const program = new Program(idl, programId, provider);

const lottery = fromJsonToKeypair(
  JSON.parse(fs.readFileSync(`lottery10.json`, "utf8"))
);

const joinn = async (users) => {
    for(let i = 0; i < users; i++) {
      const player = await anchor.web3.Keypair.generate();

      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(
            player.publicKey,
            LAMPORTS_PER_SOL*5
        )
      );
      const idx = (await program.account.lottery.fetch(lottery.publicKey))
      .playersAmount;
      console.log(idx)
      const buf = Buffer.alloc(4);
      buf.writeUIntBE(idx, 0, 4);
      const [ticket] = await anchor.web3.PublicKey.findProgramAddress(
        [buf, lottery.publicKey.toBytes()],
        program.programId
      );
      console.log(player.publicKey.toString());
      await program.methods
        .join()
        .accounts({
          lottery: lottery.publicKey,
          ticket,
          player: player.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([player])
        .rpc();
    }
};

joinn(8)
