
import './globals.css';
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { HeaderUser, HeaderUserData } from '@/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'DCG Dental CE Platform',
  description: 'A simple, functional platform for finding and sharing dental continuing education courses.',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  let initialUser: HeaderUser | null = null;
  let initialUserData: HeaderUserData | null = null;

  if (user) {
    initialUser = { id: user.id, email: user.email ?? null };
    const { data } = await supabase
      .from('users')
      .select('is_admin, full_name')
      .eq('id', user.id)
      .single();
    if (data) {
      initialUserData = { is_admin: data.is_admin, full_name: data.full_name };
    }
  }

  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50 text-gray-900`}>
        <Header
          key={initialUser?.id ?? 'guest'}
          initialUser={initialUser}
          initialUserData={initialUserData}
        />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
