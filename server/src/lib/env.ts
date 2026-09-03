import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

const REQUIRED_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_JWKS_URL",
  "B2_APPLICATION_KEY_ID",
  "B2_APPLICATION_KEY",
  "B2_BUCKET",
  "B2_ENDPOINT",
] as const;

const missing = REQUIRED_KEYS.filter(
  (k) => !process.env[k] || process.env[k]!.length === 0,
);

if (missing.length > 0) {
  console.error(
    `[env] missing required environment variables: ${missing.join(", ")}`,
  );
}

export const env = createEnv({
  server: {
    SUPABASE_URL: z.url(),
    SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    SUPABASE_SECRET_KEY: z.string().min(1),
    SUPABASE_JWKS_URL: z.url(),
    B2_APPLICATION_KEY_ID: z.string().min(1),
    B2_APPLICATION_KEY: z.string().min(1),
    B2_BUCKET: z.string().min(1),
    B2_ENDPOINT: z.string().min(1),
    B2_PREFIX: z.string().default(""),
    GOOGLE_VISION_API_KEY: z
      .string()
      .optional()
      .describe("chave da API do Google Vision; sem ela o endpoint /expenses/ocr falha com retry"),
    PORT: z.coerce.number().default(3001),
    FRONTEND_ORIGIN: z
      .string()
      .default("http://localhost:3000")
      .describe("comma-separated list of allowed origins"),
  },
  runtimeEnv: process.env,
});