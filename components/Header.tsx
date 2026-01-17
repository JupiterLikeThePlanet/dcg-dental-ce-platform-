'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

const Header: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setIsClient(true);
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
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
          <Link href="/classes" className="text-gray-700 hover:text-blue-700 text-sm font-medium">
            Browse Classes
          </Link>

          <Link href="/submit" className="text-gray-700 hover:text-blue-700 text-sm font-medium">
            Submit Class
          </Link>
          
          {user ? (
            <div className="flex items-center gap-4">
              <span className="hidden md:inline text-xs text-gray-500 font-mono">{user.email}</span>
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-700 text-sm font-medium">
                Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
              >
                Logout
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
