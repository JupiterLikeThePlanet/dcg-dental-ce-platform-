'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface UserData {
  is_admin: boolean;
  full_name: string | null;
}

const Header: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setIsClient(true);
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Fetch additional user data (is_admin, full_name)
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('is_admin, full_name')
          .eq('id', user.id)
          .single();
        setUserData(data);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('is_admin, full_name')
          .eq('id', session.user.id)
          .single();
        setUserData(data);
      } else {
        setUserData(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    setUser(null);
    setUserData(null);
    window.location.href = '/';
  };

  // Get initials for avatar
  const getInitials = () => {
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

  // Don't render auth-dependent UI until client-side
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
          <Link href="/classes" className="text-gray-700 hover:text-blue-700 text-sm font-medium transition-colors">
            Browse Classes
          </Link>

          <Link href="/submit" className="text-gray-700 hover:text-blue-700 text-sm font-medium transition-colors">
            Submit Class
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              {/* User Avatar & Info - Links to admin dash for admins, regular dash for others */}
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
              <Link href="/login" className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors shadow-sm">
                Login
              </Link>
              <Link href="/signup" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition-colors">
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