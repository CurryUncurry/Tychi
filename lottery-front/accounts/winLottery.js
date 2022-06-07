const anchor = require("@project-serum/anchor");
const fs = require("fs");
const { AnchorProvider, Program } = require("@project-serum/anchor");
const { Keypair, Connection, PublicKey } = require("@solana/web3.js");

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

const win = async () => {
  const lottery = fromJsonToKeypair(
    JSON.parse(fs.readFileSync(`lottery2.json`, "utf8"))
  );
  // 8Gtppa1DQjSxN5RRfiochZiRko8jL96K5jrR8ZycNMom
  const oracle = fromJsonToKeypair(
    JSON.parse(fs.readFileSync(`oracle.json`, "utf8"))
  );
  await program.methods
    .pickWinner()
    .accounts({
      lottery: lottery.publicKey,
      oracle: oracle.publicKey,
      clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
    })
    .signers([oracle])
    .rpc();

    const idx = (await program.account.lottery.fetch(lottery.publicKey))
      .winner_index;

      const buf = Buffer.alloc(4);
      buf.writeUIntBE(idx, 0, 4);
      const [ticket] = await anchor.web3.PublicKey.findProgramAddress(
        [buf, lottery.publicKey.toBytes()],
        program.programId
      );


  await program.methods
    .setWinner()
    .accounts({
      lottery: lottery.publicKey,
      ticket
    })
    .signers([])
    .rpc();
};

win();
