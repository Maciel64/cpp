import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

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
    PORT: z.coerce.number().default(3001),
    FRONTEND_ORIGIN: z.url().default("http://localhost:3000"),
  },
  runtimeEnv: process.env,
});