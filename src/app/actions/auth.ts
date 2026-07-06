'use server';
// Auth server actions: sign in / sign up / sign out.
import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const HOME: Record<string, string> = { applicant: '/portal', worker: '/worker', supervisor: '/supervisor', admin: '/admin' };

export async function signIn(_prev: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const next = String(formData.get('next') || '');
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'Sign-in failed: ' + error.message };
  const role = (data.user?.app_metadata?.calsaws_role as string) ?? 'applicant';
  redirect(next && next.startsWith('/') ? next : (HOME[role] ?? '/portal'));
}

export async function signUp(_prev: { error?: string } | undefined, formData: FormData) {
  const fullName = String(formData.get('full_name') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const next = String(formData.get('next') || '');
  if (!fullName || !email || password.length < 8) {
    return { error: 'Name, email, and a password of at least 8 characters are required.' };
  }
  // Create confirmed applicant account server-side (no email round-trip in the demo),
  // then sign in with the normal auth flow. Role cannot be chosen by the user.
  const admin = createAdminClient();
  const { error: createErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createErr && !/already/i.test(createErr.message)) return { error: 'Sign-up failed: ' + createErr.message };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'Account created but sign-in failed: ' + error.message };
  redirect(next && next.startsWith('/') ? next : '/portal');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
