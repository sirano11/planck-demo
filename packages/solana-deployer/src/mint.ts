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
import { DEVNET_PROGRAM_ID, WSOLMint } from '@raydium-io/raydium-sdk-v2';
import { Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

import { connection, initSdk, owner, txVersion } from './raydium';
import { revokeMintAuthority } from './revoke';

const metadata = {
  name: 'Test Token',
  symbol: 'TEST',
  uri: '',
};

// TODO: uploader 도 설정 가능함 https://developers.metaplex.com/token-metadata/mint

// Faucet: https://faucet.solana.com

const main = async () => {
  const umi = createUmi('https://api.devnet.solana.com', 'confirmed').use(
    mplTokenMetadata(),
  );
  const publisherKeypair = umi.eddsa.createKeypairFromSecretKey(
    // FIXME: Inject PK from other safer sources like .env
    // TODO: also need to run faucet -> add balance check?
    Uint8Array.from(
      '164,106,67,123,209,159,38,87,225,69,45,70,174,249,223,214,17,115,81,217,123,28,199,252,54,201,103,39,240,113,60,133,70,45,193,156,162,221,175,86,113,103,125,141,127,90,122,129,140,98,174,167,55,163,200,168,230,196,247,17,51,20,95,113'
        .split(',')
        .map((v) => parseInt(v, 10)),
    ),
  );
  const publisherSigner = createSignerFromKeypair(umi, publisherKeypair);
  console.log(publisherSigner.publicKey.toString());
  console.log(publisherSigner.secretKey.toString());

  const mintSigner = generateSigner(umi);
  console.log(mintSigner.publicKey.toString());
  console.log(mintSigner.secretKey.toString());

  umi.use(signerIdentity(publisherSigner));

  // check balance of publisher
  const balance = await umi.rpc.getBalance(publisherSigner.publicKey);
  console.log(balance);

  const res = await createAndMint(umi, {
    ...metadata,
    mint: mintSigner,
    authority: umi.identity,
    sellerFeeBasisPoints: percentAmount(0),
    decimals: 9,
    amount: BigInt(100_000_000) * BigInt(10 ** 9),
    tokenOwner: publisherSigner.publicKey,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi, {
    confirm: { commitment: 'confirmed' },
  });
  console.log(res);
  console.log(mintSigner.publicKey);

  // Owner = keypair defined with @solana/web3.js Keypair
  // Revoke to fix token supply
  await revokeMintAuthority(mintSigner.publicKey.toString(), connection, owner);

  const raydium = await initSdk();

  const { marketInfo } = await (async () => {
    const { execute, extInfo, transactions } = await raydium.marketV2.create({
      baseInfo: {
        mint: Keypair.fromSecretKey(mintSigner.secretKey).publicKey,
        decimals: 9,
      },
      quoteInfo: {
        mint: WSOLMint,
        decimals: 9,
      },
      lotSize: 1,
      tickSize: 0.01,
      // dexProgramId: OPEN_BOOK_PROGRAM,
      dexProgramId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET, // devnet
      txVersion,
      // optional: set up priority fee here
      // computeBudgetConfig: {
      //   units: 600000,
      //   microLamports: 100000000,
      // },
    });

    const marketInfo = Object.keys(extInfo.address).reduce(
      (acc, cur) => ({
        ...acc,
        [cur]: extInfo.address[cur as keyof typeof extInfo.address].toBase58(),
      }),
      {},
    ) as {
      marketId: string;
      requestQueue: string;
      eventQueue: string;
      bids: string;
      asks: string;
      baseVault: string;
      quoteVault: string;
      baseMint: string;
      quoteMin: string;
    };

    console.log(
      `create market total ${transactions.length} txs, market info: `,
      marketInfo,
    );

    const txIds = await execute({
      // set sequentially to true means tx will be sent when previous one confirmed
      sequentially: true,
    });

    console.log('create market txIds:', txIds);

    return { marketInfo };
  })();

  const { execute, extInfo } = await raydium.liquidity.createPoolV4({
    programId: DEVNET_PROGRAM_ID.AmmV4,
    marketInfo: {
      marketId: new PublicKey(marketInfo.marketId),
      // programId: OPEN_BOOK_PROGRAM,
      programId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET, // devnet
    },
    baseMintInfo: {
      mint: Keypair.fromSecretKey(mintSigner.secretKey).publicKey,
      decimals: 9,
    },
    quoteMintInfo: {
      mint: WSOLMint,
      decimals: 9,
    },
    baseAmount: new BN(1 * 10 ** 9),
    quoteAmount: new BN(1 * 10 ** 9),

    // sol devnet faucet: https://faucet.solana.com/
    // baseAmount: new BN(4 * 10 ** 9), // if devent pool with sol/wsol, better use amount >= 4*10**9
    // quoteAmount: new BN(4 * 10 ** 9), // if devent pool with sol/wsol, better use amount >= 4*10**9

    startTime: new BN(0), // unit in seconds
    ownerInfo: {
      useSOLBalance: true,
    },
    associatedOnly: false,
    txVersion,
    // feeDestinationId: FEE_DESTINATION_ID,
    feeDestinationId: DEVNET_PROGRAM_ID.FEE_DESTINATION_ID, // devnet
    // optional: set up priority fee here
    // computeBudgetConfig: {
    //   units: 600000,
    //   microLamports: 10000000,
    // },
  });

  const executionResult = Object.keys(extInfo.address).reduce(
    (acc, cur) => ({
      ...acc,
      [cur]: extInfo.address[cur as keyof typeof extInfo.address].toBase58(),
    }),
    {},
  ) as {
    programId: string;
    ammId: string;
    ammAuthority: string;
    ammOpenOrders: string;
    lpMint: string;
    coinMint: string;
    pcMint: string;
    coinVault: string;
    pcVault: string;
    withdrawQueue: string;
    ammTargetOrders: string;
    poolTempLp: string;
    marketProgramId: string;
    marketId: string;
    ammConfigId: string;
    feeDestinationId: string;
  };

  const { txId } = await execute();
  console.log('amm pool created! txId: ', txId, ', poolKeys:', executionResult);
};

main()
  .then(() => {
    console.log('✨ Done');
    process.exit(0);
  })
  .catch(console.error);
