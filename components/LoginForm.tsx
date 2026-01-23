'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in and get the user data from the response
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // authData.user contains the logged-in user
      const user = authData.user;
      
      if (!user) {
        throw new Error('Login failed - no user returned');
      }

      // Show full-screen loading overlay while checking admin status
      setIsRedirecting(true);

      // Check if user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('is_admin, full_name')
        .eq('id', user.id)
        .single();

      // Redirect based on admin status
      if (userData?.is_admin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
      
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      setLoading(false);
      setIsRedirecting(false);
    }
  };

  // Show full-screen overlay when redirecting
  if (isRedirecting) {
    return <LoadingOverlay message="Signing you in..." />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </>
        ) : (
          'Login'
        )}
      </button>

      <div className="pt-4 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account? <Link href="/signup" className="text-blue-600 font-semibold hover:underline">Create one</Link>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;