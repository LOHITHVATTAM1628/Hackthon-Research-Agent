import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, role } = body;

    if (!id || !email) {
      return NextResponse.json(
        { error: 'Missing required user fields' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('users')
      .upsert(
        {
          id,
          name: name || email.split('@')[0],
          email,
          role: role === 'admin' ? 'admin' : 'researcher',
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) {
      console.warn('Sync profile Supabase error:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
