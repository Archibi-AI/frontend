# Archibi web

The website version of the Archibi app, served at `https://archibi.ca/{ideabank,hiring,ai,account,billing,auth}`.
Next.js 16 (App Router) + TypeScript. The browser talks only to same-origin `/bff/*` route handlers; those call
the Archibi API server-side with a rotating, httpOnly-cookie web session.

> **Public repository — never commit secrets.** Real values live only in `.env.production` on the server
> (names: `.env.example`).

## Develop
```bash
docker run --rm -it -v "$PWD":/app -v archibi_frontend_nm:/app/node_modules -w /app node:22-bookworm \
  bash -lc 'corepack enable && pnpm install && pnpm verify'
```
`pnpm verify` = lint → typecheck → unit tests → production build.

## Run locally against a local Archibi API
```bash
docker compose -f docker-compose.local.yml --env-file .env.local up -d --build   # http://localhost:3100
```

## Layout
`src/app` routes (thin) · `src/features/<section>` vertical slices · `src/server` server-only (Django client, session, BFF) · `src/shared` UI kit, errors, config.
