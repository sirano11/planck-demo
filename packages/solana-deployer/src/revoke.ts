import {
  AuthorityType,
  createSetAuthorityInstruction,
  getMint,
} from '@solana/spl-token';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

// https://github.com/archiesnipes/create-new-solana-tokens/blob/main/mintToken.ts#L116
export const revokeMintAuthority = async (
  tokenAddress: string,
  connection: Connection,
  wallet: Keypair,
) => {
  try {
    if (!wallet) {
      throw new Error('Owner wallet keypair not found');
    }

    console.log(`mint address to revoke: ${tokenAddress}`);

    const mintInfo = await getMint(connection, new PublicKey(tokenAddress));
    console.log(mintInfo);
    if (mintInfo.mintAuthority !== null) {
      console.log(`disabling mint and freeze authority...`);

      let tx = new Transaction();

      tx.add(
        createSetAuthorityInstruction(
          new PublicKey(tokenAddress), // mint acocunt || token account
          wallet.publicKey, // current auth
          AuthorityType.MintTokens, // authority type
          null, // new auth (you can pass `null` to close it)
        ),
      );

      tx.add(
        createSetAuthorityInstruction(
          new PublicKey(tokenAddress), // mint acocunt || token account
          wallet.publicKey, // current auth
          AuthorityType.FreezeAccount, // authority type
          null, // new auth (you can pass `null` to close it)
        ),
      );

      const signature = await sendAndConfirmTransaction(
        connection,
        tx,
        [wallet],
        {
          skipPreflight: true,
        },
      );

      console.log(`mint and freeze successfully disabled: ${signature}`);
    } else {
      console.log(`mint and freeze authority already disabled`);
    }
  } catch (error) {
    throw new Error(`error in revoke mint authority, ${error}`);
  }
};
