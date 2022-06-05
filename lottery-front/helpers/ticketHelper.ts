import { web3 } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

export const createTicket = async (
  idx: number,
  pulbicKey: PublicKey,
  programId: PublicKey
) => {
  const buf = Buffer.alloc(4);
  buf.writeUIntBE(idx, 0, 4);
  const [ticket] = await web3.PublicKey.findProgramAddress(
    [buf, pulbicKey.toBytes()],
    programId
  );
  return ticket;
};
