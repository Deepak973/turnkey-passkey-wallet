import { toast } from "sonner";
import ViewTransactionButton from "@/components/view-transaction.button";

interface ToastProps {
  message: string;
  description?: string;
}

export const showToast = {
  success: ({ message, description }: ToastProps) => {
    toast.success(message, {
      description,
      style: {
        backgroundColor: "black",
        color: "white",
      },
    });
  },
  error: ({ message, description }: ToastProps) => {
    toast.error(message, {
      description,
      style: {
        backgroundColor: "black",
        color: "white",
      },
    });
  },
  warning: ({ message, description }: ToastProps) => {
    toast.warning(message, {
      description,
      style: {
        backgroundColor: "black",
        color: "white",
      },
    });
  },
  info: ({ message, description }: ToastProps) => {
    toast.info(message, {
      description,
      style: {
        backgroundColor: "black",
        color: "white",
      },
    });
  },
};

export const showTransactionToast = ({
  id,
  hash,
  title,
  description,
  type = "loading",
}: {
  id?: number | string;
  hash?: string;
  title: string;
  description: string;
  type?: "loading" | "success" | "error";
}) => {
  if (type === "loading") {
    return toast.loading(title, {
      id,
      description,
      action: <ViewTransactionButton hash={hash} />,
    });
  }
  return toast[type](title, {
    id,
    description,
    action: {
      label: "View Transaction",
      onClick: () => hash && window.open(`https://etherscan.io/tx/${hash}`),
    },
  });
};
