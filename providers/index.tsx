"use client";

import { TurnkeyProvider } from "@turnkey/sdk-react";
import { EthereumWallet } from "@turnkey/wallet-stamper";
import { turnkeyConfig } from "@/config/turnkey";
import { AuthProvider } from "./auth-provider";

const wallet = new EthereumWallet();

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <TurnkeyProvider
    config={{
      rpId: turnkeyConfig.passkey.rpId,
      apiBaseUrl: turnkeyConfig.apiBaseUrl,
      defaultOrganizationId: turnkeyConfig.organizationId,
      wallet: wallet,
    }}
  >
    <AuthProvider> {children}</AuthProvider>
  </TurnkeyProvider>
);
