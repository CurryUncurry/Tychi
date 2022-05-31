import { PublicKey } from '@solana/web3.js';
import fs from 'fs'
import path from 'path'

const directory = path.join(process.cwd()).split('/');
directory[directory.length] = 'accounts';
const accountsDirectory = directory.join('/');

export const getAccountsPublicKeys = () => {
    const fileNames = fs.readdirSync(accountsDirectory);
    return fileNames.map(fileName => {
        if (/^lottery/.test(fileName)) {
            const account = JSON.parse(fs.readFileSync(`${accountsDirectory}/${fileName}`, 'utf8'));
            const arr = Object.values(account._keypair.publicKey) as any;
            const arrPk = new Uint8Array(arr);
            const pk = new PublicKey(arrPk)
            return pk.toString();
        }
      }).filter(e => e);
}