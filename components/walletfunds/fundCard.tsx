"use client";

import { useState, useEffect } from "react";
import { useWallets } from "@/providers/wallet-provider";
import { CopyIcon, HandCoins } from "lucide-react";
import { formatEther } from "viem";
import { toast } from "sonner";
import Funds from "./funds";

export const useTokenPrice = () => {
  const [ethPrice, setEthPrice] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchEthPrice = async () => {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
      const data = await response.json();
      setEthPrice(data.ethereum.usd);
    };
    fetchEthPrice();
  }, []);

  return { ethPrice };
};

export default function FundsCard() {
  const { state } = useWallets();

  const { selectedAccount } = state;
  const { ethPrice } = useTokenPrice();
  const [usdAmount, setUsdAmount] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (ethPrice && selectedAccount?.balance !== undefined) {
      const balanceInEther = formatEther(selectedAccount?.balance);
      setUsdAmount(Number(balanceInEther) * ethPrice);
    }
  }, [ethPrice, selectedAccount?.balance]);

  const handleCopyAddress = () => {
    if (selectedAccount?.address) {
      navigator.clipboard.writeText(selectedAccount.address);
      toast.success("Address copied to clipboard");
    }
  };

  return (
    <div className="w-full max-w-md p-4 border rounded-md shadow-md bg-white">
      <h2 className="text-lg font-semibold mb-2">Funds Balance</h2>
      <div
        className="text-sm flex items-center gap-2 cursor-pointer"
        onClick={handleCopyAddress}
      >
        {selectedAccount?.address || "No Address"}
        <CopyIcon className="h-3 w-3" />
      </div>
      <div className="text-4xl font-bold mt-2">
        ${usdAmount?.toFixed(2) || "0.00"}
        <span className="ml-1 text-sm text-gray-500">USD</span>
      </div>
      <div className="text-sm text-gray-500 mt-1">
        {selectedAccount?.balance
          ? parseFloat(
              Number(formatEther(selectedAccount?.balance)).toFixed(8)
            ).toString()
          : "0"}{" "}
        ETH
      </div>

      <Funds />
    </div>
  );
}
