"use client";

import { createContext, ReactNode, useContext, useReducer } from "react";
import { useRouter } from "next/navigation";
import {
  createUserSubOrg,
  getSubOrgId,
  getSubOrgIdByEmail,
  getSubOrgIdByPublicKey,
  initEmailAuth,
  oauth,
} from "@/actions/turnkey";
import {
  AuthClient,
  ReadOnlySession,
  setStorageValue,
  StorageKeys,
} from "@turnkey/sdk-browser";
import { useTurnkey, TurnkeyProvider } from "@turnkey/sdk-react";
import { WalletType } from "@turnkey/wallet-stamper";

import { Email, User } from "@/types/turnkey";
import { turnkeyConfig } from "@/config/turnkey";
import { EthereumWallet } from "@turnkey/wallet-stamper";

const wallet = new EthereumWallet();

export const loginResponseToUser = (
  loginResponse: {
    organizationId: string;
    organizationName: string;
    userId: string;
    username: string;
    session?: string;
    sessionExpiry?: string;
  },
  authClient: AuthClient
): User => {
  const subOrganization = {
    organizationId: loginResponse.organizationId,
    organizationName: loginResponse.organizationName,
  };

  let read: ReadOnlySession | undefined;
  if (loginResponse.session) {
    read = {
      token: loginResponse.session,
      expiry: Number(loginResponse.sessionExpiry),
    };
  }

  return {
    userId: loginResponse.userId,
    username: loginResponse.username,
    organization: subOrganization,
    session: {
      read,
      authClient,
    },
  };
};

type AuthActionType =
  | { type: "PASSKEY"; payload: User }
  | { type: "INIT_EMAIL_AUTH" }
  | { type: "COMPLETE_EMAIL_AUTH"; payload: User }
  | { type: "EMAIL_RECOVERY"; payload: User }
  | { type: "WALLET_AUTH"; payload: User }
  | { type: "OAUTH"; payload: User }
  | { type: "LOADING"; payload: boolean }
  | { type: "ERROR"; payload: string };

interface AuthState {
  loading: boolean;
  error: string;
  user: User | null;
}

const initialState: AuthState = {
  loading: false,
  error: "",
  user: null,
};

function authReducer(state: AuthState, action: AuthActionType): AuthState {
  switch (action.type) {
    case "LOADING":
      return { ...state, loading: action.payload };
    case "ERROR":
      return { ...state, error: action.payload, loading: false };
    case "INIT_EMAIL_AUTH":
      return { ...state, loading: false, error: "" };
    case "COMPLETE_EMAIL_AUTH":
      return { ...state, user: action.payload, loading: false, error: "" };
    case "PASSKEY":
    case "EMAIL_RECOVERY":
    case "WALLET_AUTH":
    case "OAUTH":
      return { ...state, user: action.payload, loading: false, error: "" };
    default:
      return state;
  }
}

const AuthContext = createContext<{
  state: AuthState;
  initEmailLogin: (email: Email) => Promise<void>;
  completeEmailAuth: (params: {
    userEmail: string;
    continueWith: string;
    credentialBundle: string;
  }) => Promise<void>;
  loginWithPasskey: (email?: Email) => Promise<void>;
  loginWithWallet: () => Promise<void>;
  // loginWithOAuth: (credential: string, providerName: string) => Promise<void>;
  // loginWithGoogle: (credential: string) => Promise<void>;
  // loginWithApple: (credential: string) => Promise<void>;
  // loginWithFacebook: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
}>({
  state: initialState,
  initEmailLogin: async () => {},
  completeEmailAuth: async () => {},
  loginWithPasskey: async () => {},
  loginWithWallet: async () => {},
  // loginWithOAuth: async () => {},
  // loginWithGoogle: async () => {},
  // loginWithApple: async () => {},
  // loginWithFacebook: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();
  const { turnkey, authIframeClient, passkeyClient, walletClient } =
    useTurnkey();

  const initEmailLogin = async (email: Email) => {
    dispatch({ type: "LOADING", payload: true });
    try {
      const response = await initEmailAuth({
        email,
        targetPublicKey: `${authIframeClient?.iframePublicKey}`,
      });

      if (response) {
        dispatch({ type: "INIT_EMAIL_AUTH" });
        router.push(`/email-auth?userEmail=${encodeURIComponent(email)}`);
      }
    } catch (error: any) {
      dispatch({ type: "ERROR", payload: error.message });
    } finally {
      dispatch({ type: "LOADING", payload: false });
    }
  };

  const completeEmailAuth = async ({
    userEmail,
    continueWith,
    credentialBundle,
  }: {
    userEmail: string;
    continueWith: string;
    credentialBundle: string;
  }) => {
    if (userEmail && continueWith === "email" && credentialBundle) {
      dispatch({ type: "LOADING", payload: true });

      try {
        await authIframeClient?.injectCredentialBundle(credentialBundle);
        if (authIframeClient?.iframePublicKey) {
          const loginResponse =
            await authIframeClient?.loginWithReadWriteSession(
              authIframeClient.iframePublicKey
            );
          if (loginResponse?.organizationId) {
            router.push("/dashboard");
          }
        }
      } catch (error: any) {
        dispatch({ type: "ERROR", payload: error.message });
      } finally {
        dispatch({ type: "LOADING", payload: false });
      }
    }
  };

  const loginWithPasskey = async (email?: Email) => {
    dispatch({ type: "LOADING", payload: true });
    try {
      console.log("trying");
      const subOrgId = await getSubOrgIdByEmail(email as Email);
      console.log("subOrgId", subOrgId);

      if (subOrgId?.length) {
        const loginResponse = await passkeyClient?.login();
        console.log("loginResponse", loginResponse);
        if (loginResponse?.organizationId) {
          dispatch({
            type: "PASSKEY",
            payload: loginResponseToUser(loginResponse, AuthClient.Passkey),
          });
          router.push("/dashboard");
        }
      } else {
        // User either does not have an account with a sub organization
        // or does not have a passkey
        // Create a new passkey for the user

        console.log("goin in else");
        console.log(email);
        const { encodedChallenge, attestation } =
          (await passkeyClient?.createUserPasskey({
            publicKey: {
              user: {
                name: email,
                displayName: email,
              },
            },
          })) || {};

        console.log(encodedChallenge, attestation);

        // Create a new sub organization for the user
        if (encodedChallenge && attestation) {
          const { subOrg, user } = await createUserSubOrg({
            email: email as Email,
            passkey: {
              challenge: encodedChallenge,
              attestation,
            },
          });

          if (subOrg && user) {
            await setStorageValue(
              StorageKeys.UserSession,
              loginResponseToUser(
                {
                  userId: user.userId,
                  username: user.userName,
                  organizationId: subOrg.subOrganizationId,
                  organizationName: "",
                  session: undefined,
                  sessionExpiry: undefined,
                },
                AuthClient.Passkey
              )
            );

            router.push("/dashboard");
          }
        }
      }
    } catch (error: any) {
      console.log("error", error);
      dispatch({ type: "ERROR", payload: error.message });
    } finally {
      console.log("error");
      dispatch({ type: "LOADING", payload: false });
    }
  };

  const loginWithWallet = async () => {
    dispatch({ type: "LOADING", payload: true });

    try {
      const publicKey = await walletClient?.getPublicKey();

      if (!publicKey) {
        throw new Error("No public key found");
      }

      // Try and get the suborg id given the user's wallet public key
      const subOrgId = await getSubOrgIdByPublicKey(publicKey);

      // If the user has a suborg id, use the oauth flow to login
      if (subOrgId) {
        const loginResponse = await walletClient?.login({
          organizationId: subOrgId,
        });

        if (loginResponse?.organizationId) {
          router.push("/dashboard");
        }
      } else {
        // If the user does not have a suborg id, create a new suborg for the user
        const { subOrg, user } = await createUserSubOrg({
          wallet: {
            publicKey: publicKey,
            type: WalletType.Ethereum,
          },
        });

        if (subOrg && user) {
          await setStorageValue(
            StorageKeys.UserSession,
            loginResponseToUser(
              {
                userId: user.userId,
                username: user.userName,
                organizationId: subOrg.subOrganizationId,
                organizationName: "",
                session: undefined,
                sessionExpiry: undefined,
              },
              AuthClient.Wallet
            )
          );

          router.push("/dashboard");
        }
      }
    } catch (error: any) {
      dispatch({ type: "ERROR", payload: error.message });
    } finally {
      dispatch({ type: "LOADING", payload: false });
    }
  };

  // const loginWithOAuth = async (credential: string, providerName: string) => {
  //   dispatch({ type: "LOADING", payload: true })
  //   try {
  //     // Determine if the user has a sub-organization associated with their email
  //     let subOrgId = await getSubOrgId({ oidcToken: credential })

  //     if (!subOrgId) {
  //       // User does not have a sub-organization associated with their email
  //       // Create a new sub-organization for the user
  //       const { subOrg } = await createUserSubOrg({
  //         oauth: {
  //           oidcToken: credential,
  //           providerName,
  //         },
  //       })
  //       subOrgId = subOrg.subOrganizationId
  //     }

  //     if (authIframeClient?.iframePublicKey) {
  //       const oauthResponse = await oauth({
  //         credential,
  //         targetPublicKey: authIframeClient?.iframePublicKey,
  //         targetSubOrgId: subOrgId,
  //       })
  //       const injectSuccess = await authIframeClient?.injectCredentialBundle(
  //         oauthResponse.credentialBundle
  //       )
  //       if (injectSuccess) {
  //         const loginResponse =
  //           await authIframeClient?.loginWithReadWriteSession(
  //             authIframeClient.iframePublicKey
  //           )
  //         if (loginResponse?.organizationId) {
  //           router.push("/dashboard")
  //         }
  //       }
  //     }
  //   } catch (error: any) {
  //     dispatch({ type: "ERROR", payload: error.message })
  //   } finally {
  //     dispatch({ type: "LOADING", payload: false })
  //   }
  // }

  // const loginWithGoogle = async (credential: string) => {
  //   await loginWithOAuth(credential, "Google Auth - Embedded Wallet")
  // }

  // const loginWithApple = async (credential: string) => {
  //   await loginWithOAuth(credential, "Apple Auth - Embedded Wallet")
  // }

  // const loginWithFacebook = async (credential: string) => {
  //   await loginWithOAuth(credential, "Facebook Auth - Embedded Wallet")
  // }

  const logout = async () => {
    await turnkey?.logoutUser();
    // googleLogout()
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        initEmailLogin,
        completeEmailAuth,
        loginWithPasskey,
        loginWithWallet,
        // loginWithOAuth,
        //     loginWithGoogle,
        //     loginWithApple,
        //     loginWithFacebook,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
