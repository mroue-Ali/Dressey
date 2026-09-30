# Dressy

Dress-rental management app for a single business owner: dress inventory, booking
schedule with availability, and cash flow. Beige theme.

## Layout
- mobile/   - React Native + Expo (SDK 57), Expo Router, routes in mobile/src/app/
- web/      - browser version: React + TypeScript + Vite, React Router, pages in web/src/pages/.
  Same Supabase project and features as mobile; sidebar on wide screens, bottom tabs on phones.
- supabase/ - database schema (schema.sql). No custom backend: the apps talk to Supabase directly, secured by RLS.

## Key rules
- Availability lives in mobile/src/lib/availability.ts: a rental on day D blocks
  D-1 (pickup) through D+2 (return, cleaning); event dates for one dress must be
  >= 3 days apart. supabase/schema.sql enforces the same rule with an exclusion
  constraint — keep the two in sync.
- Data: mobile/src/data/store.tsx loads everything from Supabase after sign-in and writes through
  on each action. Keys come from mobile/.env (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY,
  see .env.example). Dress photos go to the private `dress-photos` bucket as <user_id>/<dress_id>.jpg.
- Single owner account, created in the Supabase dashboard; the app has sign-in only, no sign-up.
  Login is by username: the app maps it to <username>@dressey.app (see usernameToEmail in lib/backend.ts).
- Shared code: web/ imports mobile's plain-TypeScript modules through the `@mobile` alias —
  mobile/src/lib/{availability,format,backend}.ts and mobile/src/data/{types,labels,rows,totals}.ts.
  Keep those free of React Native / Expo imports. web/src/data/store.tsx mirrors
  mobile/src/data/store.tsx (only photo upload differs), so change the two together.
- Edit screens reuse the add forms: mobile opens /<thing>/new?id=…, web uses /<thing>/:id/edit
  (dress, booking, funding, expense). On web, Cash Flow movements link to what they came from.

## Notes for Claude
- Never commit .env files or Supabase keys.
- In mobile/: `npx tsc --noEmit` to typecheck; `npx expo start --web` to preview.
- In web/: `npm run typecheck`, `npm run build` (→ web/dist, a static SPA: the host must serve
  index.html for unknown paths); preview with the "web" entry in .claude/launch.json (port 5180).
  Keys come from web/.env (VITE_SUPABASE_URL / VITE_SUPABASE_KEY, same values as mobile/.env).
- APK (local, no EAS): in mobile/ run `npx expo prebuild -p android --clean`, then in mobile/android
  `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a`
  → android/app/build/outputs/apk/release/app-release.apk. android/ is generated and gitignored;
  configure icons/splash in app.json, never by editing android/.
- Web deploy: https://dressey.mroueali.com on Ali's VPS (see ~/.claude/vps-mroueali.md). deploy/ holds
  the Dockerfile (build context = repo root, since web imports mobile/src), docker-compose.yml
  (127.0.0.1:8001 → nginx serving the SPA), the host nginx block, and deploy.sh. Supabase keys go
  in deploy/.env on the server as build args. To update: run deploy/deploy.sh on the server.
- Brand assets (mobile/assets/logo.png, icon, splash) are cut from the owner's "dresséy Logo.pdf";
  background ivory is #F6F1EB to match the artwork.
