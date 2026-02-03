import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Singleton browser client
 * Only ONE client instance is ever created per browser session
 */
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Create/get the Supabase client for use in Browser/Client Components
 * Use this in components with 'use client' directive
 * 
 * This uses a singleton pattern - the same client instance is returned
 * every time, preventing memory leaks and race conditions.
 */
export const createClient = () => {
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
};

/**
 * Direct access to the singleton client
 * Prefer createClient() for consistency
 */
export const supabase = createClient();

/**
 * Legacy helper - use createClient() instead
 * @deprecated
 */
export const getSupabase = () => createClient();