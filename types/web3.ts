import { Address, Hex, Transaction as ViemTransaction } from "viem";

import "viem/window";

export interface CustomTransaction {
  blockNumber: number;
  from: `0x${string}`;
  to: `0x${string}` | null;
  hash: string;
  value: bigint | null;
  status: "sent" | "received";
  timestamp: string;
}

export type Transaction = ViemTransaction | CustomTransaction;

export interface AlchemyMinedTransaction {
  removed: boolean;
  transaction: {
    blockHash: Hex;
    blockNumber: Hex;
    from: Address;
    gas: Hex;
    gasPrice: Hex;
    maxFeePerGas: Hex;
    maxPriorityFeePerGas: Hex;
    hash: Hex;
    input: Hex;
    nonce: Hex;
    to: Address;
    transactionIndex: Hex;
    value: Hex;
    type: Hex;
    accessList: any[];
    chainId: Hex;
    v: Hex;
    r: Hex;
    s: Hex;
    yParity: Hex;
  };
}
