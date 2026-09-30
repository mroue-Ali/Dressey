# Dressy

Dress-rental management app for a single business owner: dress inventory, booking
schedule with availability, and cash flow. Beige theme.

## Layout
- mobile/   - React Native + Expo (SDK 57), Expo Router, routes in mobile/src/app/
- supabase/ - database schema (schema.sql). No custom backend: the app talks to Supabase directly, secured by RLS.

## Key rules
- Availability lives in mobile/src/lib/availability.ts: a rental on day D blocks
  D-1 (pickup) through D+2 (return, cleaning); event dates for one dress must be
  >= 3 days apart. supabase/schema.sql enforces the same rule with an exclusion
  constraint — keep the two in sync.
- Data: mobile/src/data/store.tsx loads everything from Supabase after sign-in and writes through
  on each action. Keys come from mobile/.env (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY,
  see .env.example). Dress photos go to the private `dress-photos` bucket as <user_id>/<dress_id>.jpg.
- Single owner account, created in the Supabase dashboard; the app has sign-in only, no sign-up.
  Login is by username: the app maps it to <username>@dressey.app (see usernameToEmail in lib/supabase.ts).

## Notes for Claude
- Never commit .env files or Supabase keys.
- In mobile/: `npx tsc --noEmit` to typecheck; `npx expo start --web` to preview.
- APK (local, no EAS): in mobile/ run `npx expo prebuild -p android --clean`, then in mobile/android
  `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a`
  → android/app/build/outputs/apk/release/app-release.apk. android/ is generated and gitignored;
  configure icons/splash in app.json, never by editing android/.
- Brand assets (mobile/assets/logo.png, icon, splash) are cut from the owner's "dresséy Logo.pdf";
  background ivory is #F6F1EB to match the artwork.
