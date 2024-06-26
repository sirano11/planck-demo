// import { TransactionOutput } from 'web3';

type HexString = string;
// type Bytes = Uint8Array | HexString;
type Numbers = number | bigint | string | HexString;

type TransactionOutput = {
  readonly to?: HexString;
  readonly from?: HexString;
  readonly input: string;
  readonly gas?: Numbers;
  readonly gasLimit?: string;
  readonly nonce: Numbers;
  readonly value: Numbers;
  readonly blockNumber?: Numbers;
  readonly transactionIndex?: Numbers;
} & (
  | {
      maxPriorityFeePerGas: Numbers;
      maxFeePerGas: Numbers;
      gasPrice?: never;
    }
  | {
      maxPriorityFeePerGas?: never;
      maxFeePerGas?: never;
      gasPrice: Numbers;
    }
);

export type EVMTxn = Omit<TransactionOutput, 'input'> & {
  hash: string;
  input?: string | undefined;
};

export type EVMBlock = {
  height: number;
  timestamp: Date;
  transactions: EVMTxn[];
};
