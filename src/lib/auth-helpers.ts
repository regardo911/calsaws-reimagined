// Server-side auth context helpers for staff pages.
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';

export async function getStaffContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('auth_user_id', user.id).single();
  if (!profile || !['worker', 'supervisor', 'admin'].includes(profile.role)) redirect('/portal');
  return { supabase, user, profile };
}
