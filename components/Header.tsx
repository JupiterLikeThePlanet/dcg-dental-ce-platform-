'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { User, AuthChangeEvent } from '@supabase/supabase-js';

interface UserData {
  is_admin: boolean;
  full_name: string | null;
}

const Header: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin, full_name')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    setIsClient(true);

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          const data = await fetchUserData(session.user.id);
          setUserData(data);
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              setUser(session.user);
              const data = await fetchUserData(session.user.id);
              setUserData(data);
            }
            break;

          case 'SIGNED_OUT':
            setUser(null);
            setUserData(null);
            break;

          case 'TOKEN_REFRESHED':
            if (session?.user) {
              setUser(session.user);
            }
            break;

          case 'USER_UPDATED':
            if (session?.user) {
              setUser(session.user);
              const data = await fetchUserData(session.user.id);
              setUserData(data);
            }
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchUserData]);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setMobileMenuOpen(false);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed:', err);
    }

    window.location.href = '/';
  };

  const getInitials = (): string => {
    if (userData?.full_name) {
      return userData.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return '?';
  };

  // Server-side / initial render - minimal header
  if (!isClient) {
    return (
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-700 hover:text-blue-800 transition-colors">
            <span className="hidden sm:inline">DCG Dental CE</span>
            <span className="sm:hidden">DCG</span>
          </Link>
          <nav className="hidden sm:flex gap-6 items-center">
            <Link href="/classes" className="text-gray-700 hover:text-blue-700 text-sm font-medium">
              Browse Classes
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  const dashboardHref = userData?.is_admin ? '/admin' : '/dashboard';
  const dashboardLabel = userData?.is_admin ? 'Admin Dashboard' : 'My Dashboard';

  return (
    <header className="bg-white border-b border-gray-200 relative" ref={mobileMenuRef}>
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-700 hover:text-blue-800 transition-colors">
          <span className="hidden sm:inline">DCG Dental CE</span>
          <span className="sm:hidden">DCG</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex gap-6 items-center">
          <Link
            href="/classes"
            className="text-gray-700 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            Browse Classes
          </Link>

          <Link
            href="/submit"
            className="text-gray-700 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            Submit Class
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href={dashboardHref}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                  {getInitials()}
                </div>
                <span className="hidden md:inline text-sm text-gray-700">
                  {userData?.full_name || user.email?.split('@')[0]}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`px-3 py-1.5 text-sm border border-gray-300 rounded transition-colors ${
                  isLoggingOut
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors shadow-sm"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
          <Link
            href="/classes"
            className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Browse Classes
          </Link>

          <Link
            href="/submit"
            className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Submit Class
          </Link>

          {user ? (
            <>
              {/* User info row */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {getInitials()}
                </div>
                <span className="text-sm text-gray-700 truncate">
                  {userData?.full_name || user.email?.split('@')[0]}
                </span>
              </div>

              <Link
                href={dashboardHref}
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {dashboardLabel}
              </Link>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-3 w-full px-4 py-3.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </>
          ) : (
            <div className="flex gap-3 px-4 py-3">
              <Link
                href="/login"
                className="flex-1 py-2 bg-blue-600 text-white text-sm font-semibold rounded text-center hover:bg-blue-700 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded text-center hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
