"use client";

import { useState, useEffect } from "react";
import { useWallets } from "@/providers/wallet-provider";
import { useTurnkey } from "@turnkey/sdk-react";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CopyIcon,
  Wallet,
  Plus,
  Minus,
  InfoIcon,
} from "lucide-react";
import {
  formatEther,
  getAddress,
  parseEther,
  type TransactionRequest,
} from "viem";
import { toast } from "sonner";
import { truncateAddress } from "@/lib/utils";
import { getPublicClient, getTurnkeyWalletClient } from "@/lib/web3";
import { showTransactionToast } from "@/lib/toast";
import QRCode from "react-qr-code";
import { useIsClient } from "usehooks-ts";
import { Alchemy, Network, AssetTransfersCategory } from "alchemy-sdk";
import { CustomTransaction } from "@/types/web3";
import SendTransaction from "@/components/walletfunds/sendTransaction";
import { EarnkitUser, Email } from "@/types/turnkey";
import { getUserByEmail } from "@/actions/turnkey";
import { User } from "@/types/turnkey";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { useTokenPrice } from "@/hooks/useTokenPrice";

const settings = {
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  network: Network.BASE_SEPOLIA,
};

const alchemy = new Alchemy(settings);

type View = "main" | "send" | "receive" | "sendTransaction";

export default function WalletPage() {
  const { state } = useWallets();
  const { selectedAccount } = state;
  const { ethPrice } = useTokenPrice();
  const { client } = useTurnkey();
  const isClient = useIsClient();

  // State for balance and transactions
  const [usdAmount, setUsdAmount] = useState<number | undefined>(undefined);
  const [transactions, setTransactions] = useState<CustomTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // State for send functionality
  const [currentView, setCurrentView] = useState<View>("main");
  const [ethAmount, setEthAmount] = useState("");
  const [amountUSD, setAmountUSD] = useState("0");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [transactionRequest, setTransactionRequest] =
    useState<TransactionRequest | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [walletClient, setWalletClient] = useState<any>(null);
  const { user } = useUser();

  // Add effects from fundCard and activityCard
  useEffect(() => {
    const initializeWalletClient = async () => {
      console.log("initializeWalletClient", selectedAccount, client);
      if (!selectedAccount || !client) return;
      const walletClient = await getTurnkeyWalletClient(
        client,
        selectedAccount.address
      );
      setWalletClient(walletClient);
    };
    initializeWalletClient();
  }, [selectedAccount, client]);

  useEffect(() => {
    const ethAmountParsed = parseFloat(ethAmount || "0");
    if (!isNaN(ethAmountParsed) && ethPrice) {
      setAmountUSD(
        (ethAmountParsed * parseFloat(ethPrice.toFixed(2))).toFixed(2)
      );
    }
  }, [ethAmount, ethPrice]);

  useEffect(() => {
    if (ethPrice && selectedAccount?.balance !== undefined) {
      const balanceInEther = formatEther(selectedAccount?.balance);
      setUsdAmount(Number(balanceInEther) * ethPrice);
    }
  }, [ethPrice, selectedAccount?.balance]);

  useEffect(() => {
    if (recipientAddress && selectedAccount?.balance && ethAmount) {
      const ethAmountWei = parseEther(ethAmount);
      setIsValid(ethAmountWei > 0 && ethAmountWei < selectedAccount.balance);
    }
  }, [ethAmount, recipientAddress, selectedAccount]);

  // Add transaction fetching effect
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

  // Add handlers from funds component
  const handlePreviewSendTransaction = async () => {
    console.log("handlePreviewSendTransaction", selectedAccount, walletClient);
    if (!selectedAccount || !walletClient) return;
    try {
      const transaction = await walletClient.prepareTransactionRequest({
        to: getAddress(recipientAddress),
        value: parseEther(ethAmount),
      });
      setTransactionRequest(transaction);
      setCurrentView("sendTransaction");
    } catch (error) {
      toast.error("Failed to prepare transaction");
      console.error(error);
    }
  };

  const handleSendTransaction = async (transaction: TransactionRequest) => {
    if (!selectedAccount || !walletClient) return;
    try {
      const publicClient = getPublicClient();
      const hash = await walletClient.sendTransaction(transaction);

      const toastId = showTransactionToast({
        hash,
        title: "Sending transaction...",
        description: `Sending ${ethAmount} ETH to ${truncateAddress(
          recipientAddress
        )}`,
        type: "loading",
      });

      await publicClient.waitForTransactionReceipt({ hash });

      showTransactionToast({
        id: toastId,
        hash,
        title: "Transaction sent! 🎉",
        description: `Sent ${ethAmount} ETH to ${truncateAddress(
          recipientAddress
        )}`,
        type: "success",
      });

      setCurrentView("main");
      setEthAmount("");
      setRecipientAddress("");
    } catch (error) {
      console.error("Error sending transaction:", error);
      showTransactionToast({
        title: "Error sending transaction",
        description: "Please try again",
        type: "error",
      });
    }
  };

  if (!isClient) return null;

  return (
    <div className="p-8">
      <Toaster position="bottom-right" />

      {currentView === "sendTransaction" && transactionRequest ? (
        <SendTransaction
          transaction={transactionRequest}
          amountUSD={amountUSD}
          ethPrice={ethPrice || 0}
          network="Base Sepolia"
          onSend={handleSendTransaction}
          onBack={() => setCurrentView("send")}
        />
      ) : (
        <>
          {/* Header with Balance and Actions */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <h2 className="text-gray-600 text-sm mb-2">Wallet balance</h2>
              <h1 className="text-4xl font-bold">
                ${usdAmount?.toFixed(2) || "0.00"}
              </h1>
              <div className="flex items-center text-sm text-gray-500 mt-2">
                <Wallet className="w-4 h-4 mr-1" />
                {selectedAccount?.balance
                  ? parseFloat(
                      Number(formatEther(selectedAccount?.balance)).toFixed(8)
                    ).toString()
                  : "0"}{" "}
                ETH
              </div>
              <div
                className="mt-4 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                onClick={() => {
                  if (selectedAccount?.address) {
                    navigator.clipboard.writeText(selectedAccount.address);
                    toast.success("Address copied to clipboard");
                  }
                }}
              >
                <div className="text-sm text-gray-600 font-medium truncate">
                  {selectedAccount?.address || "No Address"}
                </div>
                <CopyIcon className="h-4 w-4 text-gray-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="px-2 py-3 rounded-lg flex flex-col items-center"
                onClick={() => setCurrentView("receive")}
              >
                <Plus className="w-8 h-8 bg-gray-200 rounded-lg mb-1" />
                <span className="text-sm text-gray-600">Deposit</span>
              </button>
              <button
                className="px-2 py-3 rounded-lg flex flex-col items-center"
                onClick={() => setCurrentView("send")}
              >
                <Minus className="w-8 h-8 bg-gray-200 rounded-lg mb-1" />
                <span className="text-sm text-gray-600">Withdraw</span>
              </button>
            </div>
          </div>

          {/* Send/Receive Views */}
          {currentView === "send" && (
            <div className="p-4 border rounded-lg mb-8">
              <input
                type="text"
                placeholder="Amount in ETH"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                className="w-full p-2 border rounded-lg mb-2"
              />
              <div className="text-sm text-gray-500 mb-4">
                ≈ ${amountUSD} USD
              </div>
              <input
                type="text"
                placeholder="Recipient Address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setCurrentView("main")}
                  className="flex-1 p-3 bg-gray-200 text-gray-700 rounded-lg"
                >
                  Back
                </button>
                <button
                  onClick={handlePreviewSendTransaction}
                  className="flex-1 p-3 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                  disabled={!isValid}
                >
                  Preview Send
                </button>
              </div>
            </div>
          )}

          {currentView === "receive" && (
            <div className="p-4 border rounded-lg mb-8 text-center">
              <h2 className="text-lg font-semibold mb-4">Your Address</h2>
              <div className="text-sm bg-gray-100 p-2 rounded-lg flex items-center justify-between mb-4">
                {truncateAddress(selectedAccount?.address || "")}
                <button
                  className="ml-2 text-gray-500"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      selectedAccount?.address || ""
                    );
                    toast.success("Address copied!");
                  }}
                >
                  <CopyIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="mb-4">
                <QRCode
                  value={selectedAccount?.address || ""}
                  size={128}
                  className="mx-auto"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <InfoIcon className="h-4 w-4" />
                <span>
                  This address can only receive testnet Base (Sepolia)
                </span>
              </div>
              <button
                onClick={() => setCurrentView("main")}
                className="w-full p-3 bg-gray-200 text-gray-700 rounded-lg"
              >
                Back
              </button>
            </div>
          )}

          {/* Activity Section */}
          {currentView === "main" && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Activity log</h2>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 flex items-center justify-center">
                  <span className="text-gray-500">No activity yet</span>
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
          )}
        </>
      )}
    </div>
  );
}
