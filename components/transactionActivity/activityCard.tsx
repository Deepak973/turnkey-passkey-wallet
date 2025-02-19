"use client";
import { useEffect, useState } from "react";
import { useWallets } from "@/providers/wallet-provider";
import { Alchemy, Network, AssetTransfersCategory } from "alchemy-sdk";
import { formatEther, getAddress, parseEther } from "viem";
import { truncateAddress } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { CustomTransaction } from "@/types/web3";

const settings = {
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  network: Network.BASE_SEPOLIA,
};

const alchemy = new Alchemy(settings);

export default function ActivityCard() {
  const { state } = useWallets();
  const { selectedAccount } = state;
  const [transactions, setTransactions] = useState<CustomTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!selectedAccount?.address) return;

      try {
        const [sentResponse, receivedResponse] = await Promise.all([
          alchemy.core.getAssetTransfers({
            fromAddress: selectedAccount.address,
            excludeZeroValue: false,
            category: [
              AssetTransfersCategory.ERC20,
              AssetTransfersCategory.EXTERNAL,
            ],
            withMetadata: true,
          }),
          alchemy.core.getAssetTransfers({
            toAddress: selectedAccount.address,
            excludeZeroValue: false,
            category: [
              AssetTransfersCategory.ERC20,
              AssetTransfersCategory.EXTERNAL,
            ],
            withMetadata: true,
          }),
        ]);

        const transactions = [
          ...sentResponse.transfers.map(
            ({ blockNum, from, to, hash, value, metadata }) => ({
              blockNumber: Number(blockNum),
              from: getAddress(from),
              to: to ? getAddress(to) : null,
              hash,
              value: value ? parseEther(value.toString()) : null,
              status: "sent" as const,
              timestamp: metadata.blockTimestamp,
            })
          ),
          ...receivedResponse.transfers.map(
            ({ blockNum, from, to, hash, value, metadata }) => ({
              blockNumber: Number(blockNum),
              from: getAddress(from),
              to: to ? getAddress(to) : null,
              hash,
              value: value ? parseEther(value.toString()) : null,
              status: "received" as const,
              timestamp: metadata.blockTimestamp,
            })
          ),
        ].sort((a, b) => b.blockNumber - a.blockNumber);

        setTransactions(transactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [selectedAccount?.address]);

  if (loading) {
    return <div className="p-4">Loading transactions...</div>;
  }

  return (
    <div className="w-full max-w-md p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Transaction Activity</h2>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.hash}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              {tx.status === "sent" ? (
                <ArrowUpRight className="text-red-500" />
              ) : (
                <ArrowDownRight className="text-green-500" />
              )}
              <div>
                <div className="font-medium">
                  {tx.status === "sent" ? "Sent" : "Received"}
                </div>
                <div className="text-sm text-gray-500">
                  {tx.status === "sent"
                    ? `To: ${truncateAddress(tx.to || "")}`
                    : `From: ${truncateAddress(tx.from)}`}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">
                {tx.value ? formatEther(tx.value) : "0"} ETH
              </div>
              <div className="text-sm text-gray-500">
                {new Date(tx.timestamp).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No transactions found
          </div>
        )}
      </div>
    </div>
  );
}
