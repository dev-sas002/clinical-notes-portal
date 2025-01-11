# Care Notes App

The Next.js application. Full documentation — architecture, configuration,
design notes and limitations — lives in the
[repository root README](../../README.md).

## Quick start

```bash
npm install
npm run dev     # http://localhost:3000, seeded demo data, no backend needed
```

Sign in with `a.rivera@northfield.example` / `demo-pass`.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (types and lint are enforced) |
| `npm start` | Serve the production build |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest in watch mode |
| `npm run type-check` | `tsc --noEmit` |
| `npm run lint` | ESLint (flat config, `next/core-web-vitals` + TypeScript) |
| `npm run format` / `format:check` | Prettier |
| `npm run screenshots` | Re-capture `docs/screenshots/` against a running instance |
