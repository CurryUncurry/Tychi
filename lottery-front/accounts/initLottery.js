const anchor = require("@project-serum/anchor");
const fs = require('fs');
const { AnchorProvider, Program } = require("@project-serum/anchor");
const { Keypair, Connection, PublicKey } = require("@solana/web3.js");
const { SystemProgram } = anchor.web3;

const fromJsonToKeypair = (keypair) => {
  const arr = Object.values(keypair._keypair.secretKey);
  const secret = new Uint8Array(arr);
  const account = Keypair.fromSecretKey(secret);
  return account;
};

// 3TLEEkYedBR9Y8s4dWnspvg7SXM1zGC2hX9Cn8mEiLCm
const admin = fromJsonToKeypair(JSON.parse(fs.readFileSync(`admin.json`, 'utf8')));
const connection = new Connection("http://127.0.0.1:8899");
const provider = new AnchorProvider(
  connection,
  new anchor.Wallet(admin),
  { preflightCommitment: 'processed' },
);

const programId = new PublicKey("GaYLemFsWLURxRTLHhS735SdfYBuV3v2aJshrrTmvsmU");
const idl = JSON.parse(fs.readFileSync(`idl.json`, 'utf8'));
const program = new Program(idl, programId, provider);

const init = async (maxUsers) => {
    const oracle = JSON.parse(fs.readFileSync(`oracle.json`, 'utf8'));
    const lottery = anchor.web3.Keypair.generate();
    await program.methods
    .initializeLottery(new anchor.BN(maxUsers), oracle.publicKey)
    .accounts({
      lottery: lottery.publicKey,
      admin: admin.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([lottery, admin])
    .rpc();

    fs.writeFileSync(`./lottery${maxUsers}.json`, JSON.stringify(lottery));
}

init(3);