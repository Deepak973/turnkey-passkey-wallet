"use client";

import React, { useEffect, useState } from "react";
// import { useTransactions } from "@/providers/transactions-provider"
import { useWallets } from "@/providers/wallet-provider";
import { useTurnkey } from "@turnkey/sdk-react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CopyIcon,
  InfoIcon,
} from "lucide-react";
import QRCode from "react-qr-code";
import { useIsClient, useMediaQuery } from "usehooks-ts";
import { formatEther, getAddress, parseEther, TransactionRequest } from "viem";
import { showTransactionToast } from "@/lib/toast";
import { truncateAddress } from "@/lib/utils";
import {
  getPublicClient,
  getTurnkeyWalletClient,
  fundWallet,
} from "@/lib/web3";
import { useTokenPrice } from "./fundCard";
import { toast } from "react-toastify";
import SendTransaction from "./sendTransaction";

type View = "main" | "send" | "receive" | "sendTransaction";

export default function Funds() {
  const { state } = useWallets();
  const { selectedAccount } = state;
  const { ethPrice } = useTokenPrice();
  const { client } = useTurnkey();
  //   const { addPendingTransaction } = useTransactions()
  const isClient = useIsClient();
  const isDesktop = useMediaQuery("(min-width: 564px)");
  const [loading, setLoading] = useState(false);

  const [currentView, setCurrentView] = useState<View>("main");
  const [selectedAction, setSelectedAction] = useState("send");
  const [ethAmount, setEthAmount] = useState("");
  const [amountUSD, setAmountUSD] = useState("0");
  const [recipientAddress, setRecipientAddress] = useState(
    "0xE7F48E6dCfBeA43ff5CD1F1570f6543878cCF156"
  );
  const [transactionRequest, setTransactionRequest] =
    useState<TransactionRequest | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [walletClient, setWalletClient] = useState<any>(null);

  useEffect(() => {
    const initializeWalletClient = async () => {
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
    if (recipientAddress && selectedAccount?.balance && ethAmount) {
      const ethAmountWei = parseEther(ethAmount);
      setIsValid(ethAmountWei > 0 && ethAmountWei < selectedAccount.balance);
    }
  }, [ethAmount, recipientAddress, selectedAccount]);

  const handleFund = async () => {
    if (!selectedAccount?.address) {
      toast.error("No wallet selected");
      return;
    }

    setLoading(true);
    try {
      await fundWallet(selectedAccount.address);
    } catch (error) {
      console.error("Error funding wallet:", error);
      toast.error("Failed to fund wallet");
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewSendTransaction = async () => {
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

  if (currentView === "sendTransaction" && transactionRequest && ethPrice) {
    return (
      <SendTransaction
        transaction={transactionRequest}
        amountUSD={amountUSD}
        ethPrice={ethPrice}
        network="Base Sepolia"
        onSend={handleSendTransaction}
        onBack={() => setCurrentView("send")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-2">
        {/* <button
          onClick={handleFund}
          disabled={loading || !selectedAccount}
          className="flex-1 p-3 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Funding..." : "Fund Wallet"}
        </button> */}
      </div>
      {currentView === "main" && (
        <div className="flex gap-2">
          <button
            className="flex-1 p-3 bg-blue-500 text-white rounded-lg"
            onClick={() => setCurrentView("send")}
          >
            <ArrowUp className="inline mr-2" /> Send
          </button>
          <button
            className="flex-1 p-3 bg-green-500 text-white rounded-lg"
            onClick={() => setCurrentView("receive")}
          >
            <ArrowDown className="inline mr-2" /> Receive
          </button>
        </div>
      )}
      {currentView === "send" && (
        <div className="p-4 border rounded-lg">
          <input
            type="text"
            placeholder="Amount in ETH"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            className="w-full p-2 border rounded-lg mb-2"
          />
          <div className="text-sm text-gray-500 mb-4">≈ ${amountUSD} USD</div>
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
        <div className="p-4 border rounded-lg text-center">
          <h2 className="text-lg font-semibold mb-4">Your Address</h2>
          <div className="text-sm bg-gray-100 p-2 rounded-lg flex items-center justify-between mb-4">
            {truncateAddress(selectedAccount?.address || "")}
            <button
              className="ml-2 text-gray-500"
              onClick={() => {
                navigator.clipboard.writeText(selectedAccount?.address || "");
                toast.success("Address copied!");
              }}
            >
              <CopyIcon className="h-4 w-4" />
            </button>
            {/* To Do : add info symbol */}
            <InfoIcon className="h-4 w-4" />
            <div className="text-sm text-gray-500">
              This address can only receive testnet Base (Sepolia). Sending any
              other asset to this address will result in loss of funds.
            </div>
          </div>
          <div className="mb-4">
            <QRCode
              value={selectedAccount?.address || ""}
              size={128}
              className="mx-auto"
            />
          </div>
          <button
            onClick={() => setCurrentView("main")}
            className="w-full p-3 bg-gray-200 text-gray-700 rounded-lg"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
