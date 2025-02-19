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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <p className="font-medium">No transactions yet</p>
            <p className="text-sm">Your recent transactions will appear here</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.hash}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-white">
                  {tx.status === "sent" ? (
                    <ArrowUpRight className="h-5 w-5 text-red-500" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
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
                <div className="font-medium text-gray-900">
                  {tx.value ? formatEther(tx.value) : "0"} ETH
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(tx.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
