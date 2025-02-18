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
    console.log("trying");
    console.log("username", username);
    const subOrgId = await getSubOrgIdByUsername(username as string);
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
      console.log("Incorrect username");
    }
  };

  const signupWithPasskey = async (email: Email, username: string) => {
    dispatch({ type: "LOADING", payload: true });

    const usernameExists = await checkUsernameExists(username as string);
    console.log("usernameExists", usernameExists);

    // User either does not have an account with a sub organization
    // or does not have a passkey
    // Create a new passkey for the user
    try {
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
          userName: username as string,
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
    } catch (error: any) {
      console.log("error", error);
      dispatch({ type: "ERROR", payload: error.message });
    } finally {
      console.log("error");
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
