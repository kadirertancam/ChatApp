# Messaging Monorepo

A production-ready, real-time messaging application targeting mobile (iOS/Android) and web from a single codebase.

- Backend: Node.js, TypeScript, Express, Socket.IO, Prisma, PostgreSQL, Redis
- Mobile/Web: Expo React Native + React Native Web, TypeScript

## Quick Start

Requirements: Node 18+, pnpm, Docker

```bash
pnpm install
pnpm db:up
pnpm db:migrate
pnpm dev:backend
# in another terminal
pnpm dev:mobile
```

Open Expo DevTools and run on web or device/emulator. Backend runs on http://localhost:4000.