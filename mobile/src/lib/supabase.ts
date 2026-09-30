import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!url || !key) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY in mobile/.env');
}

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Keep the session fresh only while the app is in the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export const PHOTO_BUCKET = 'dress-photos';

// Supabase logins need an email, so usernames map to a hidden address that
// never receives mail. Create users in the dashboard as <username>@dressey.app.
const USERNAME_DOMAIN = 'dressey.app';

export function usernameToEmail(username: string): string {
  const u = username.trim().toLowerCase();
  return u.includes('@') ? u : `${u}@${USERNAME_DOMAIN}`;
}

export function emailToUsername(email: string | undefined): string {
  return (email ?? '').replace(`@${USERNAME_DOMAIN}`, '');
}

/** Turns Supabase/Postgres errors into messages the owner can act on. */
export function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === '23P01') return 'This dress is already booked too close to that date.';
  if (error.code === '23514') return 'Some values are not allowed (check the amounts).';
  if (/fetch|network/i.test(error.message)) return 'No internet connection. Please try again.';
  return error.message;
}
