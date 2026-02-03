'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  
  // Get supabase client once
  const supabase = createClient();

  // Fetch user profile data
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

  // Initialize auth state
  useEffect(() => {
    setIsClient(true);

    // Get initial session
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        // Handle different auth events
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
            // Session refreshed, user stays the same
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

  // Logout handler
  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent double-clicks
    
    setIsLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error) {
        console.error('Logout error:', error);
        // Still proceed with client-side cleanup
      }

      // Clear local state
      setUser(null);
      setUserData(null);
      
      // Navigate to home and refresh to clear any server-side cache
      router.push('/');
      router.refresh();
      
    } catch (err) {
      console.error('Logout failed:', err);
      // Force reload as fallback
      window.location.href = '/';
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Get initials for avatar
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
            DCG Dental CE
          </Link>
          <nav className="flex gap-6 items-center">
            <Link href="/classes" className="text-gray-700 hover:text-blue-700 text-sm font-medium">
              Browse Classes
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-700 hover:text-blue-800 transition-colors">
          DCG Dental CE
        </Link>
        
        <nav className="flex gap-6 items-center">
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
              {/* User Avatar & Info */}
              <Link 
                href={userData?.is_admin ? '/admin' : '/dashboard'}
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
      </div>
    </header>
  );
};

export default Header;