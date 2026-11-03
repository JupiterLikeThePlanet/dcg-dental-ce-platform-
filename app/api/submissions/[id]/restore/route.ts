import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getActor, restoreSubmission } from '@/lib/submission-removal';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Restore a listing. Admins: any submission. Providers: their own.
// Rules live in lib/submission-removal.ts.
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

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

    const actor = await getActor(supabase);
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await restoreSubmission(getSupabaseAdmin(), id, actor);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, purgeAt: result.purgeAt });
  } catch (error) {
    console.error('Restore submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
