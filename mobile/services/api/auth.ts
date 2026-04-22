import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

export async function login({ email, password }: { email: string; password: string }) {
  let data;
  try {
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error) throw new Error(res.error.message);
    data = res.data;
  } catch (err: any) {
    if (err?.message === 'Network request failed') {
      throw new Error('Cannot reach Supabase. Check your internet connection or Supabase project status.');
    }
    throw err;
  }

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
  let data;
  try {
    const res = await supabase.auth.signUp({ email, password });
    if (res.error) throw new Error(res.error.message);
    data = res.data;
  } catch (err: any) {
    if (err?.message === 'Network request failed') {
      throw new Error('Cannot reach Supabase. Check your internet connection or Supabase project status.');
    }
    throw err;
  }

  if (!data.session) {
    throw new Error('Check your email to confirm your account before signing in.');
  }

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
