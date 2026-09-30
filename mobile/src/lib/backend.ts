// Supabase helpers that don't need the client. Plain TypeScript, no React Native:
// the web app (web/) imports this file too.

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
  if (error.code === '23503') return 'This is still used by other records, so it cannot be deleted.';
  if (/fetch|network/i.test(error.message)) return 'No internet connection. Please try again.';
  return error.message;
}
