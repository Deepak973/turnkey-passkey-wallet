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

import { User as DbUser } from "@/app/db/entities/User";
import { EntityManager } from "typeorm";
import { Passkey } from "@/app/db/entities/Passkey";

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

  loginWithPasskey: (username: string) => Promise<void>;
  signupWithPasskey: (email: Email, username: string) => Promise<void>;

  logout: () => Promise<void>;
}>({
  state: initialState,
  loginWithPasskey: async () => {},
  signupWithPasskey: async () => {},

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

      console.log("response", response);
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      if (!data.user) {
        throw new Error("Invalid response format");
      }

      const user = data.user;
      if (!user.passkeys?.length) {
        throw new Error("No passkey found for this user");
      }

      const subOrgId = await getSubOrgIdByUsername(username);
      if (!subOrgId?.length) {
        throw new Error("User organization not found");
      }
      console.log("subOrgId", subOrgId);

      const loginResponse = await passkeyClient?.login();
      if (!loginResponse?.organizationId) {
        throw new Error("Login failed");
      }

      // Verify the login response matches the stored user data
      if (loginResponse.organizationId !== user.organizationId) {
        throw new Error("Invalid organization");
      }

      dispatch({
        type: "PASSKEY",
        payload: loginResponseToUser(loginResponse, AuthClient.Passkey),
      });

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      dispatch({ type: "ERROR", payload: error.message });
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
              userId: user.userId,
              passkey: {
                challenge: encodedChallenge,
                attestation,
              },
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create user");
          }

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
    } catch (error: any) {
      console.error(error);
      dispatch({ type: "ERROR", payload: error.message });
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
