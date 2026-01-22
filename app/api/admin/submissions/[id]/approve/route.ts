import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Admin client for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
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

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Fetch the submission
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Check if already processed
    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: `Submission has already been ${submission.status}` },
        { status: 400 }
      );
    }

    // Copy submission to classes table
    const classData = {
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
      latitude: submission.latitude,
      longitude: submission.longitude,
      instructor_name: submission.instructor_name,
      provider_name: submission.provider_name,
      contact_email: submission.contact_email,
      contact_phone: submission.contact_phone,
      price: submission.price,
      ce_credits: submission.ce_credits,
      registration_url: submission.registration_url,
      image_url: submission.image_url,
      posted_by: submission.submitted_by,
      is_admin_post: false,
      status: 'approved',
    };

    const { data: newClass, error: insertError } = await supabaseAdmin
      .from('classes')
      .insert([classData])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting class:', insertError);
      return NextResponse.json(
        { error: 'Failed to create class listing' },
        { status: 500 }
      );
    }

    // Update submission status
    const { error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating submission:', updateError);
      // Rollback the class creation
      await supabaseAdmin.from('classes').delete().eq('id', newClass.id);
      return NextResponse.json(
        { error: 'Failed to update submission status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      classId: newClass.id,
      message: 'Submission approved and class published',
    });

  } catch (error) {
    console.error('Approve submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}