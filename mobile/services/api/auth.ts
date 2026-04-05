import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

export async function login({ email, password }: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  // Fetch profile from backend
  const profile = await api.get('/me').then((r) => r.data);
  return {
    user: profile,
    tokens: { access_token: data.session!.access_token, refresh_token: data.session!.refresh_token },
  };
}

export async function signup({
  email,
  password,
  full_name,
  role = 'doctor',
}: {
  email: string;
  password: string;
  full_name: string;
  role?: string;
}) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error('Check your email to confirm your account');

  // Create profile row on backend
  const profile = await api.post('/profiles/setup', { full_name, role }).then((r) => r.data);
  return {
    user: profile,
    tokens: { access_token: data.session.access_token, refresh_token: data.session.refresh_token },
  };
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function updateProfile(data: Partial<{ full_name: string; phone: string; expo_push_token: string }>) {
  return api.patch('/me', data).then((r) => r.data);
}

export async function getStoredSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  try {
    const profile = await api.get('/me').then((r) => r.data);
    return { user: profile, session: data.session };
  } catch {
    return null;
  }
}
