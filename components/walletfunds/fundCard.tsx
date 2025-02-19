"use client";
import { useState, useEffect } from "react";
import { useWallets } from "@/providers/wallet-provider";
import { CopyIcon, HandCoins, Wallet } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex flex-col">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-sm text-gray-500">Total Balance</div>
            <div className="text-3xl font-bold text-gray-900">
              ${usdAmount?.toFixed(2) || "0.00"}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Wallet className="w-4 h-4 mr-1" />
              {selectedAccount?.balance
                ? parseFloat(
                    Number(formatEther(selectedAccount?.balance)).toFixed(8)
                  ).toString()
                : "0"}{" "}
              ETH
            </div>
          </div>
        </div>

        <div
          className="mt-4 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200"
          onClick={handleCopyAddress}
        >
          <div className="text-sm text-gray-600 font-medium truncate">
            {selectedAccount?.address || "No Address"}
          </div>
          <CopyIcon className="h-4 w-4 text-gray-500" />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <Funds />
      </div>
    </div>
  );
}
