"use client";

import { createContext, ReactNode, useContext, useReducer } from "react";
import { useRouter } from "next/navigation";
import {
  checkUsernameExists,
  createUserSubOrg,
  getSubOrgIdByUsername,
} from "@/actions/turnkey";
import {
  AuthClient,
  ReadOnlySession,
  setStorageValue,
  StorageKeys,
} from "@turnkey/sdk-browser";
import { useTurnkey, TurnkeyProvider } from "@turnkey/sdk-react";

import { Email, User } from "@/types/turnkey";
import { EthereumWallet } from "@turnkey/wallet-stamper";
import { initEmailAuth } from "@/actions/turnkey";
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
  completeEmailAuth: (params: {
    userEmail: string;
    continueWith: string;
    credentialBundle: string;
  }) => Promise<void>;

  loginWithPasskey: (username: string) => Promise<void>;
  signupWithPasskey: (email: Email, username: string) => Promise<void>;
  initEmailLogin: (email: Email) => Promise<void>;

  logout: () => Promise<void>;
}>({
  state: initialState,
  initEmailLogin: async () => {},
  loginWithPasskey: async () => {},
  signupWithPasskey: async () => {},
  completeEmailAuth: async () => {},

  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();
  const { turnkey, authIframeClient, passkeyClient, walletClient } =
    useTurnkey();

  const loginWithPasskey = async (username: string) => {
    try {
      if (!username) {
        throw new Error("Username is required");
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Login failed");
      }

      if (!data.user) {
        throw new Error("Invalid response format");
      }

      const user = data.user;

      const subOrgId = await getSubOrgIdByUsername(username);
      if (!subOrgId?.length) {
        throw new Error("User organization not found");
      }

      const loginResponse = await passkeyClient?.login();
      if (!loginResponse?.organizationId) {
        throw new Error("Login failed");
      }

      if (loginResponse.organizationId !== user.organizationId) {
        throw new Error(
          "Invalid Passkey. Make sure you are using the correct passkey associated with this account"
        );
      }

      // Create the user object with the new structure
      const userResponse = loginResponseToUser(
        {
          userId: user.id,
          username: user.username,
          organizationId: user.organizationId,
          organizationName: user.organizationName,
          session: undefined,
          sessionExpiry: undefined,
        },
        AuthClient.Passkey
      );

      // Add wallet address if exists
      // if (user.walletAddress) {
      //   userResponse.walletAddress = user.walletAddress;
      // }

      dispatch({
        type: "PASSKEY",
        payload: userResponse,
      });

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      // Re-throw the error so the calling component can handle it
      throw error;
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

  const initEmailLogin = async (email: Email) => {
    dispatch({ type: "LOADING", payload: true });
    try {
      const response = await initEmailAuth({
        email,
        targetPublicKey: `${authIframeClient?.iframePublicKey}`,
      });

      if (response) {
        dispatch({ type: "INIT_EMAIL_AUTH" });
        router.push(
          `/email-authorization?userEmail=${encodeURIComponent(email)}`
        );
      }
    } catch (error: any) {
      dispatch({ type: "ERROR", payload: error.message });
    } finally {
      dispatch({ type: "LOADING", payload: false });
    }
  };

  const signupWithPasskey = async (email: Email, username: string) => {
    dispatch({ type: "LOADING", payload: true });

    try {
      const usernameExists = await checkUsernameExists(username as string);
      if (usernameExists) {
        throw new Error("Username already exists");
      }

      const { encodedChallenge, attestation } =
        (await passkeyClient?.createUserPasskey({
          publicKey: {
            user: {
              name: email,
              displayName: email,
            },
          },
        })) || {};

      if (encodedChallenge && attestation) {
        const { subOrg, user, subOrganizationName } = await createUserSubOrg({
          email: email as Email,
          passkey: {
            challenge: encodedChallenge,
            attestation,
          },
          userName: username as string,
        });

        console.log("subOrg", subOrg);
        if (subOrg && user && subOrganizationName) {
          // Save user to database through API
          const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              username,
              email,
              organizationId: subOrg.subOrganizationId,
              organizationName: subOrganizationName,
              walletAddress: subOrg.wallet?.addresses[0],
            }),
          });

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.message || "Failed to create account");
          }

          const userResponse = loginResponseToUser(
            {
              userId: data.user.id,
              username: data.user.username,
              organizationId: data.user.organizationId,
              organizationName: data.user.organizationName,
              session: undefined,
              sessionExpiry: undefined,
            },
            AuthClient.Passkey
          );

          // Add wallet address if exists
          // if (data.user.walletAddress) {
          //   userResponse.walletAddress = data.user.walletAddress;
          // }

          await setStorageValue(StorageKeys.UserSession, userResponse);

          dispatch({
            type: "PASSKEY",
            payload: userResponse,
          });

          router.push("/dashboard");
        }
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      dispatch({ type: "ERROR", payload: error.message });
      throw error;
    } finally {
      dispatch({ type: "LOADING", payload: false });
    }
  };

  const logout = async () => {
    await turnkey?.logoutUser();

    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        loginWithPasskey,
        signupWithPasskey,
        logout,
        initEmailLogin,
        completeEmailAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
