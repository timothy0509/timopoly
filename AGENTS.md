# Timopoly — Agent Notes

React + TypeScript + Vite + Tailwind CSS v4 + Convex.

## Development

- `npm run dev` — starts both the Convex local dev server (`convex dev`) and the Vite dev server in parallel. Requires a running Convex dev deployment / `VITE_CONVEX_URL`.
- `npm run build` — runs `tsc -b` then `vite build`.
- `npm run preview` — previews the Vite production build.
- `npm run convex` — alias for `convex dev`.

## TypeScript

- Project uses TypeScript project references (`tsconfig.json` references `tsconfig.app.json` for `src/` and `tsconfig.node.json` for `vite.config.ts`).
- `tsc -b` (used by `build`) compiles the whole project; prefer it over `tsc --noEmit` for verification.
- Strict lint-style flags: `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`.
- `noUnusedLocals` and `noUnusedParameters` are **temporarily disabled** while the project is in progress. Re-enable them before shipping to production.
- `allowImportingTsExtensions` and `noEmit` are on — imports keep `.ts` extensions.
- `verbatimModuleSyntax` is on — use `import type` for type-only imports.

## Styling

- Tailwind CSS v4. No `tailwind.config.js`.
- Config lives in `src/index.css` via `@import "tailwindcss"` and `@theme { ... }`.
- Custom colors are defined there (e.g. `--color-timo-dark`, `--color-timo-gold`).

## Backend / Convex

- Convex functions live in `convex/*.ts` (games, players, turns, properties, cards, trades, railway, bots).
- Schema is in `convex/schema.ts`.
- Client connects to `import.meta.env.VITE_CONVEX_URL`; local default is set in `.env.local` (`http://localhost:3210`).
- `convex/_generated/` contains generated API types and helpers — import `api` and `dataModel` from there.

## Frontend structure

- Entry point: `src/main.tsx` (creates `ConvexProvider` and mounts `App`).
- `App.tsx` routes between `GameLobby` (create/join with code) and `GameBoard` (the actual game).
- `src/lib/constants.ts` is the source of truth for board spaces, rent tables, card data, and game constants.
- `src/lib/gameLogic.ts` holds pure logic (rent, mortgage, etc.).
- `src/hooks/` contains Convex subscription hooks (`useGame`, `usePlayer`, `useTurn`).

## Important conventions

- `plan.md` is the design document, not code. Treat the implementation (`src/` and `convex/`) as the source of truth; it may diverge from the plan.
- No tests, lint, or formatter config are present in the repo. Do not assume Prettier/ESLint rules exist.
- No CI workflows or pre-commit hooks.
- `dist/` is the Vite build output; `tmp-vite/` appears to be a leftover Vite template and is not the main app.
- The project is a single package, not a monorepo.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
