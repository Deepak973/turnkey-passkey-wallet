"use server";

import {
  ApiKeyStamper,
  DEFAULT_ETHEREUM_ACCOUNTS,
  TurnkeyServerClient,
} from "@turnkey/sdk-server";
import { WalletType } from "@turnkey/wallet-stamper";
import { getAddress } from "viem";
import { Attestation, Email, Wallet } from "@/types/turnkey";
import { siteConfig } from "@/config/site";
import { turnkeyConfig } from "@/config/turnkey";
import { env } from "@/env.mjs";

const { TURNKEY_API_PUBLIC_KEY, TURNKEY_API_PRIVATE_KEY } = env;

const stamper = new ApiKeyStamper({
  apiPublicKey: TURNKEY_API_PUBLIC_KEY!,
  apiPrivateKey: TURNKEY_API_PRIVATE_KEY!,
});

const client = new TurnkeyServerClient({
  apiBaseUrl: turnkeyConfig.apiBaseUrl,
  organizationId: turnkeyConfig.organizationId,
  stamper,
});

export const createUserSubOrg = async ({
  email,
  passkey,
  wallet,
  userName,
}: {
  email?: Email;
  passkey?: {
    challenge: string;
    attestation: Attestation;
  };
  wallet?: {
    publicKey: string;
    type: WalletType;
  };
  userName?: string;
}) => {
  const authenticators = passkey
    ? [
        {
          authenticatorName: "Passkey",
          challenge: passkey.challenge,
          attestation: passkey.attestation,
        },
      ]
    : [];

  const apiKeys = wallet
    ? [
        {
          apiKeyName: "Wallet Auth - Embedded Wallet",
          publicKey: wallet.publicKey,
          curveType: "API_KEY_CURVE_SECP256K1" as const,
        },
      ]
    : [];

  const subOrganizationName = `Sub Org - ${email || wallet?.publicKey}`;
  const tempUserName =
    userName || email
      ? email?.split("@")?.[0] || email
      : wallet?.publicKey || "";

  const subOrg = await client.createSubOrganization({
    organizationId: turnkeyConfig.organizationId,
    subOrganizationName,
    rootUsers: [
      {
        userName: tempUserName as string,
        userEmail: email,
        authenticators,
        apiKeys,
        oauthProviders: [],
      },
    ],
    rootQuorumThreshold: 1,
    wallet: {
      walletName: "User Wallet",
      accounts: DEFAULT_ETHEREUM_ACCOUNTS,
    },
  });

  const userId = subOrg.rootUserIds?.[0];
  if (!userId) {
    throw new Error("No root user ID found");
  }

  const { user } = await client.getUser({
    organizationId: subOrg.subOrganizationId,
    userId,
  });

  return { subOrg, user, subOrganizationName };
};

type EmailParam = { email: Email };
type PublicKeyParam = { publicKey: string };
type UsernameParam = { username: string };
type OidcTokenParam = { oidcToken: string };

export function getSubOrgId(param: EmailParam): Promise<string>;
export function getSubOrgId(param: PublicKeyParam): Promise<string>;
export function getSubOrgId(param: UsernameParam): Promise<string>;
export function getSubOrgId(param: OidcTokenParam): Promise<string>;

export async function getSubOrgId(
  param: EmailParam | PublicKeyParam | UsernameParam | OidcTokenParam
): Promise<string> {
  let filterType: string;
  let filterValue: string;

  if ("email" in param) {
    filterType = "EMAIL";
    filterValue = param.email;
  } else if ("publicKey" in param) {
    filterType = "PUBLIC_KEY";
    filterValue = param.publicKey;
  } else if ("username" in param) {
    filterType = "USERNAME";
    filterValue = param.username;
  } else if ("oidcToken" in param) {
    filterType = "OIDC_TOKEN";
    filterValue = param.oidcToken;
  } else {
    throw new Error("Invalid parameter");
  }

  const { organizationIds } = await client.getSubOrgIds({
    organizationId: turnkeyConfig.organizationId,
    filterType,
    filterValue,
  });

  return organizationIds[0];
}

export const getSubOrgIdByEmail = async (email: Email) => {
  const { organizationIds } = await client.getSubOrgIds({
    organizationId: turnkeyConfig.organizationId,
    filterType: "EMAIL",
    filterValue: email,
  });

  return organizationIds[0];
};

export const getSubOrgIdByPublicKey = async (publicKey: string) => {
  const { organizationIds } = await client.getSubOrgIds({
    organizationId: turnkeyConfig.organizationId,
    filterType: "PUBLIC_KEY",
    filterValue: publicKey,
  });

  return organizationIds[0];
};

export const getSubOrgIdByUsername = async (username: string) => {
  return getSubOrgId({ username });
};

export const checkUsernameExists = async (username: string) => {
  const subOrgId = await getSubOrgId({ username });
  return subOrgId ? true : false;
};

export const checkEmailExists = async (email: Email) => {
  const subOrgId = await getSubOrgId({ email });
  return subOrgId ? true : false;
};

export const checkEmailExistsinDB = async (email: Email) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/email-exists`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    }
  );
  const data = await response.json();
  return data.exists;
};

export const checkUsernameExistsinDB = async (username: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/username-exists`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    }
  );
  const data = await response.json();
  return data.exists;
};

export const getUserByEmail = async (email: Email) => {
  console.log("getUserByEmail", email);
  const response = await fetch(
    `${
      process.env.NEXT_PUBLIC_APP_URL
    }/api/auth/get-user-by-email/${encodeURIComponent(email)}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const data = await response.json();
  if (data.message) {
    return null;
  }

  return data;
};

export const getUserByUsername = async (username: string) => {
  console.log("getUserByUsername", username);
  const response = await fetch(
    `${
      process.env.NEXT_PUBLIC_APP_URL
    }/api/auth/get-user-by-username/${encodeURIComponent(username)}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const data = await response.json();
  if (data.message) {
    return null;
  }

  return data;
};

export const getUser = async (userId: string, subOrgId: string) => {
  return client.getUser({
    organizationId: subOrgId,
    userId,
  });
};

export async function getWalletsWithAccounts(
  organizationId: string
): Promise<Wallet[]> {
  const { wallets } = await client.getWallets({
    organizationId,
  });

  return await Promise.all(
    wallets.map(async (wallet) => {
      const { accounts } = await client.getWalletAccounts({
        organizationId,
        walletId: wallet.walletId,
      });

      const accountsWithBalance = await Promise.all(
        accounts.map(async ({ address, ...account }) => {
          return {
            ...account,
            address: getAddress(address),
            balance: undefined,
          };
        })
      );
      return { ...wallet, accounts: accountsWithBalance };
    })
  );
}

export const getWallet = async (
  walletId: string,
  organizationId: string
): Promise<Wallet> => {
  const [{ wallet }, accounts] = await Promise.all([
    client.getWallet({ walletId, organizationId }),
    client
      .getWalletAccounts({ walletId, organizationId })
      .then(({ accounts }) =>
        accounts.map(({ address, ...account }) => {
          return {
            ...account,
            address: getAddress(address),
            balance: undefined,
          };
        })
      ),
  ]);

  return { ...wallet, accounts };
};

export const getAuthenticators = async (userId: string, subOrgId: string) => {
  const { authenticators } = await client.getAuthenticators({
    organizationId: subOrgId,
    userId,
  });
  return authenticators;
};

export const getAuthenticator = async (
  authenticatorId: string,
  subOrgId: string
) => {
  const { authenticator } = await client.getAuthenticator({
    organizationId: subOrgId,
    authenticatorId,
  });
  return authenticator;
};

const getMagicLinkTemplate = (action: string, email: string, method: string) =>
  `${process.env.NEXT_PUBLIC_APP_URL}/email-authorization?userEmail=${email}&continueWith=${method}&credentialBundle=%s`;

export const initEmailAuth = async ({
  email,
  targetPublicKey,
}: {
  email: Email;
  targetPublicKey: string;
}) => {
  const emailExists = await checkEmailExistsinDB(email);
  let organizationId = await getSubOrgIdByEmail(email as Email);

  console.log("organizationId", organizationId);
  console.log("emailExists", emailExists);

  if (!emailExists) {
    const { subOrg, user, subOrganizationName } = await createUserSubOrg({
      email: email as Email,
    });

    organizationId = subOrg.subOrganizationId;
    if (subOrg && user && subOrganizationName) {
      // Save user to database through API
      const response = await fetch(
        process.env.NEXT_PUBLIC_APP_URL + "/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            username: email?.split("@")?.[0] || "",
            email,
            turnkeyOrganizationId: subOrg.subOrganizationId,
            walletAddress: subOrg.wallet?.addresses[0],
            turnkeyUserId: user.userId,
            hasPasskey: false,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create account");
      }
    }
  }
  console.log("organizationId", organizationId);
  console.log("email", email);
  console.log("targetPublicKey", targetPublicKey);

  const magicLinkTemplate = getMagicLinkTemplate("auth", email, "email");

  if (organizationId?.length) {
    const authResponse = await client.emailAuth({
      email,
      targetPublicKey,
      organizationId,
      emailCustomization: {
        magicLinkTemplate,
      },
    });

    return authResponse;
  }
};
