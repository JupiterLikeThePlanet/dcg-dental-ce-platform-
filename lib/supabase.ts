import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Create a Supabase client for use in Browser/Client Components
 * Use this in components with 'use client' directive
 */
export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

/**
 * Singleton browser client for client-side use
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

/**
 * Legacy helper - prefer createClient()
 */
export const getSupabase = () => supabase;