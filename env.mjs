import { vercel } from "@t3-oss/env-core/presets";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID: z.string().min(1),
    NEXT_PUBLIC_APPLE_OAUTH_CLIENT_ID: z.string().min(1),
    NEXT_PUBLIC_FACEBOOK_CLIENT_ID: z.string().min(1),
    NEXT_PUBLIC_RP_ID: z.string().optional(),
    NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
    NEXT_PUBLIC_BACKEND_URL: z.string().optional(),
    NEXT_PUBLIC_BASE_URL: z.string().min(1),
    NEXT_PUBLIC_ORGANIZATION_ID: z.string().min(1),
    NEXT_PUBLIC_ALCHEMY_API_KEY: z.string().min(1),
    NEXT_PUBLIC_FACEBOOK_AUTH_VERSION: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().optional(),
  },
  server: {
    NEXT_PUBLIC_RP_ID: z.string().optional(),
    NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
    NEXT_PUBLIC_BACKEND_URL: z.string().optional(),
    FACEBOOK_SECRET_SALT: z.string().min(1),
    NEXT_PUBLIC_FACEBOOK_CLIENT_ID: z.string().min(1),
    NEXT_PUBLIC_FACEBOOK_GRAPH_API_VERSION: z.string().min(1),
    TURNKEY_API_PUBLIC_KEY: z.string().min(1),
    TURNKEY_API_PRIVATE_KEY: z.string().min(1),
    NEXT_PUBLIC_BASE_URL: z.string().min(1),
    NEXT_PUBLIC_ORGANIZATION_ID: z.string().min(1),
    NEXT_PUBLIC_ALCHEMY_API_KEY: z.string().min(1),
    COINGECKO_API_KEY: z.string().min(1),
    TURNKEY_WARCHEST_API_PUBLIC_KEY: z.string().min(1),
    TURNKEY_WARCHEST_API_PRIVATE_KEY: z.string().min(1),
    TURNKEY_WARCHEST_ORGANIZATION_ID: z.string().min(1),
    WARCHEST_PRIVATE_KEY_ID: z.string().min(1),
    NEXT_PUBLIC_DB_USER: z.string().min(1),
    NEXT_PUBLIC_DB_PASSWORD: z.string().min(1),
    NEXT_PUBLIC_DB_HOST: z.string().min(1),
    NEXT_PUBLIC_DB_PORT: z.string().min(1),
    NEXT_PUBLIC_DB_NAME: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APPLE_OAUTH_CLIENT_ID:
      process.env.NEXT_PUBLIC_APPLE_OAUTH_CLIENT_ID,
    NEXT_PUBLIC_FACEBOOK_CLIENT_ID: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID,
    NEXT_PUBLIC_FACEBOOK_GRAPH_API_VERSION:
      process.env.NEXT_PUBLIC_FACEBOOK_GRAPH_API_VERSION,
    NEXT_PUBLIC_FACEBOOK_AUTH_VERSION:
      process.env.NEXT_PUBLIC_FACEBOOK_AUTH_VERSION,
    NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID:
      process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
    NEXT_PUBLIC_RP_ID: process.env.NEXT_PUBLIC_RP_ID,
    NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL:
      process.env.NEXT_PUBLIC_VERCEL_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    FACEBOOK_SECRET_SALT: process.env.FACEBOOK_SECRET_SALT,
    TURNKEY_API_PUBLIC_KEY: process.env.TURNKEY_API_PUBLIC_KEY,
    TURNKEY_API_PRIVATE_KEY: process.env.TURNKEY_API_PRIVATE_KEY,
    NEXT_PUBLIC_ORGANIZATION_ID: process.env.NEXT_PUBLIC_ORGANIZATION_ID,
    NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
    TURNKEY_WARCHEST_API_PUBLIC_KEY:
      process.env.TURNKEY_WARCHEST_API_PUBLIC_KEY,
    TURNKEY_WARCHEST_API_PRIVATE_KEY:
      process.env.TURNKEY_WARCHEST_API_PRIVATE_KEY,
    TURNKEY_WARCHEST_ORGANIZATION_ID:
      process.env.TURNKEY_WARCHEST_ORGANIZATION_ID,
    WARCHEST_PRIVATE_KEY_ID: process.env.WARCHEST_PRIVATE_KEY_ID,
    NEXT_PUBLIC_DB_USER: process.env.NEXT_PUBLIC_DB_USER,
    NEXT_PUBLIC_DB_PASSWORD: process.env.NEXT_PUBLIC_DB_PASSWORD,
    NEXT_PUBLIC_DB_HOST: process.env.NEXT_PUBLIC_DB_HOST,
    NEXT_PUBLIC_DB_PORT: process.env.NEXT_PUBLIC_DB_PORT,
    NEXT_PUBLIC_DB_NAME: process.env.NEXT_PUBLIC_DB_NAME,
  },
  extends: [vercel()],
});
