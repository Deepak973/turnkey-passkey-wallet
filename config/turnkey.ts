import { env } from "@/env.mjs";

const {
  NEXT_PUBLIC_ORGANIZATION_ID,
  NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_RP_ID,
  NEXT_PUBLIC_ALCHEMY_API_KEY,
} = env;

export const turnkeyConfig = {
  apiBaseUrl: NEXT_PUBLIC_BASE_URL,
  organizationId: NEXT_PUBLIC_ORGANIZATION_ID,
  iFrame: {
    url: "https://auth.turnkey.com",
    elementId: "turnkey-auth-iframe-element-id",
    containerId: "turnkey-auth-iframe-container-id",
    auth: {
      url: "https://auth.turnkey.com",
      containerId: "turnkey-auth-iframe-container-id",
    },
    export: {
      url: "https://export.turnkey.com",
      containerId: "turnkey-export-iframe-container-id",
    },
    import: {
      url: "https://import.turnkey.com",
      containerId: "turnkey-import-iframe-container-id",
    },
  },
  passkey: {
    rpId: NEXT_PUBLIC_RP_ID,
  },
  rpcUrl: `https://base-sepolia.g.alchemy.com/v2/${NEXT_PUBLIC_ALCHEMY_API_KEY}`,
};
