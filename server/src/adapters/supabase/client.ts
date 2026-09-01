import { createClient } from "@supabase/supabase-js";
import { env } from "../../lib/env";

const serverOptions = { auth: { autoRefreshToken: false, persistSession: false } };

export const adminClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
  serverOptions,
);

export const publicClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_PUBLISHABLE_KEY,
  serverOptions,
);