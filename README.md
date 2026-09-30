# Dressy

Dress-rental management app: dresses, bookings/availability, and cash flow.

## Structure
- mobile/   - Expo app (the product)
- web/      - web version (React + TypeScript + Vite), same Supabase backend
- supabase/ - database schema

## Getting started
```bash
cd mobile
npm install
npx expo start
```
Scan the QR code with Expo Go, or press `w` for the web preview.

### Web
```bash
cd web
npm install
cp .env.example .env   # fill in the same Supabase URL and key as mobile/.env
npm run dev
```
`npm run build` writes a static site to `web/dist`. It is a single-page app, so the host
must serve `index.html` for every path (e.g. a rewrite of `/*` to `/index.html`).
