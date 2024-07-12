import {
  TokenStandard,
  createAndMint,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  createSignerFromKeypair,
  generateSigner,
  percentAmount,
  signerIdentity,
} from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import * as bip39 from 'bip39';
import dotenv from 'dotenv';

import { TOKENS, connection } from './constants';
import { getSolanaKeypair } from './keypair';
import { RaydiumSDK } from './raydium';
import { revokeMintAuthority } from './revoke';

dotenv.config();

// const metadata = {
//   name: 'Test Token',
//   symbol: 'TEST',
//   uri: '',
// };
// const metadata = {
//   name: 'Wrapped SOL',
//   symbol: 'wSOL',
//   uri: '',
// };
const metadata = {
  name: 'Wrapped MEME',
  symbol: 'wMEME',
  uri: '',
};

const deploy = async () => {
  const umi = createUmi('https://api.devnet.solana.com', 'confirmed').use(
    mplTokenMetadata(),
  );

  // Generate a new mnemonic (or use an existing one)
  let mnemonic = process.env.MNEMONIC || '';
  if (!mnemonic) {
    console.log(`[!] No mnemonic found. Generating a new one.`);
    mnemonic = bip39.generateMnemonic();
    console.log({ mnemonic });
  }

  const keypair = getSolanaKeypair(mnemonic);
  const publisherKeypair = umi.eddsa.createKeypairFromSecretKey(
    keypair.secretKey,
  );

  // TODO: we may also need to run faucet -> add balance check?
  // https://faucet.solana.com

  const publisherSigner = createSignerFromKeypair(umi, publisherKeypair);
  console.log(publisherSigner.publicKey.toString());
  console.log(publisherSigner.secretKey.toString());

  const mintSigner = generateSigner(umi);
  console.log(mintSigner.publicKey.toString());
  console.log(mintSigner.secretKey.toString());

  umi.use(signerIdentity(publisherSigner));

  // check balance of publisher
  const balance = await umi.rpc.getBalance(publisherSigner.publicKey);
  console.log(`balance: ${balance.basisPoints.toString()}`);

  const res = await createAndMint(umi, {
    ...metadata,
    mint: mintSigner,
    authority: umi.identity,
    sellerFeeBasisPoints: percentAmount(0),
    amount:
      TOKENS.find((t) => t.symbol == metadata.symbol)?.initialSupply! *
      BigInt(10 ** 9),
    decimals: TOKENS.find((t) => t.symbol == metadata.symbol)?.decimals!,
    tokenOwner: publisherSigner.publicKey,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi, {
    confirm: { commitment: 'confirmed' },
  });
  console.log(res);

  // Revoke to fix token supply (optional)
  // await revokeMintAuthority(
  //   mintSigner.publicKey.toString(),
  //   connection,
  //   keypair,
  // );
};

deploy()
  .then(() => {
    console.log('✨ Done');
    process.exit(0);
  })
  .catch(console.error);
