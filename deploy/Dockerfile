# Dresséy web app: build the Vite SPA, then serve it with nginx.
# Build context is the repo root, because web/ imports shared code from mobile/src.

FROM node:22-alpine AS build
WORKDIR /app

COPY web/package.json web/package-lock.json web/
RUN cd web && npm ci

# Only the plain-TypeScript modules and the logo the web app imports through @mobile.
COPY mobile/src/lib mobile/src/lib
COPY mobile/src/data mobile/src/data
COPY mobile/assets/logo.png mobile/assets/logo.png
COPY web web

# Supabase URL and publishable key are baked into the bundle at build time
# (they are public by design; row level security protects the data).
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_KEY
RUN test -n "$VITE_SUPABASE_URL" && test -n "$VITE_SUPABASE_KEY" \
  || (echo "Set VITE_SUPABASE_URL and VITE_SUPABASE_KEY in deploy/.env" && exit 1)
RUN cd web && VITE_SUPABASE_URL="$VITE_SUPABASE_URL" VITE_SUPABASE_KEY="$VITE_SUPABASE_KEY" npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist /usr/share/nginx/html
