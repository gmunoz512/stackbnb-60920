import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export const supabase = createClient<Database>(
  SUPABASE_URL || "http://127.0.0.1:54321",
  SUPABASE_PUBLISHABLE_KEY || "missing-publishable-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
