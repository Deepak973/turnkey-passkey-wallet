import { useState, useEffect } from "react";

export function useTokenPrice() {
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
}
