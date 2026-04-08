// app/api/admin/submissions/[id]/approve/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get the submission
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Check if already approved
    if (submission.status === 'approved') {
      return NextResponse.json({ error: 'Already approved' }, { status: 400 });
    }

    // Copy to classes table (with submission_id reference)
    const { error: insertError } = await supabase
      .from('classes')
      .insert([{
        title: submission.title,
        description: submission.description,
        category: submission.category,
        start_date: submission.start_date,
        end_date: submission.end_date,
        start_time: submission.start_time,
        end_time: submission.end_time,
        address_line1: submission.address_line1,
        address_line2: submission.address_line2,
        city: submission.city,
        state: submission.state,
        zip_code: submission.zip_code,
        instructor_name: submission.instructor_name,
        provider_name: submission.provider_name,
        contact_email: submission.contact_email,
        contact_phone: submission.contact_phone,
        price: submission.price,
        ce_credits: submission.ce_credits,
        registration_url: submission.registration_url,
        image_url: submission.image_url,
        submission_id: submission.id,  // Link back to submission
      }]);

    if (insertError) {
      console.error('Insert to classes error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Update submission error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Submission approved' });

  } catch (error: unknown) {
    console.error('Approve error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}