import Link from "next/link";
import { baseSepolia } from "viem/chains";

import { Button } from "@/components/ui/button";

const ViewTransactionButton = ({ hash }: { hash?: string }) => {
  if (!hash) return null;

  return (
    <Button size="sm" variant="outline" asChild>
      <Link
        target="_blank"
        className="h-5 bg-inherit text-xs"
        href={`${baseSepolia.blockExplorers.default.url}/tx/${hash}`}
      >
        View Transaction
      </Link>
    </Button>
  );
};

export default ViewTransactionButton;
