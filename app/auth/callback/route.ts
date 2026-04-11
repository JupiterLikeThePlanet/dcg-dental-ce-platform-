import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // After a successful email verification, ensure a public.users profile
      // row exists. This is the single reliable place to create it because:
      //   1. The user is confirmed (they clicked the link)
      //   2. We're server-side, so the insert can't be blocked by the browser
      //   3. upsert makes it safe to call multiple times (idempotent)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { error: profileError } = await supabase
          .from('users')
          .upsert(
            {
              id: user.id,
              email: user.email,
              // full_name is stored in auth metadata by SignupForm.tsx
              full_name: user.user_metadata?.full_name || '',
              is_admin: false,
            },
            {
              onConflict: 'id',        // if row already exists, do nothing
              ignoreDuplicates: true,  // never overwrite is_admin if already set
            }
          )

        if (profileError) {
          console.error('Failed to create user profile in public.users:', profileError)
          // Don't block the redirect — auth succeeded, profile failure is non-fatal
          // The dashboard will handle a missing profile gracefully
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
