# Repository Guidelines

## Project Structure & Module Organization
This is a Next.js App Router project. Core code lives in `app/` with `layout.tsx` and `page.tsx` as the entry points. Global styles are in `app/globals.css`. Reusable utilities live in `lib/` (see `lib/utils.ts`). Static assets belong in `public/`. The repo uses a path alias of `@/*` (e.g., `@/lib/utils`) and includes a `components.json` configuration for shadcn-style components if you add UI modules under `components/`.

## Build, Test, and Development Commands
- `npm run dev`: Start the local dev server at `http://localhost:3000`.
- `npm run build`: Build the production bundle.
- `npm run start`: Run the production server (requires `npm run build` first).
- `npm run lint`: Run ESLint with Next.js rules.

## Coding Style & Naming Conventions
Use TypeScript (`.ts`/`.tsx`) with strict mode enabled. Follow Next.js and ESLint defaults (see `eslint.config.mjs`). Keep indentation consistent at 2 spaces and prefer single responsibility React components. Naming patterns:
- React components: `PascalCase` (e.g., `UserCard.tsx`)
- Functions/variables: `camelCase`
- Files in `app/` follow Next.js routing conventions (folders and `page.tsx`).

## Testing Guidelines
No testing framework is configured yet. If you add tests, document the chosen tool (e.g., Vitest/Jest) and include a script in `package.json`. Use clear test naming such as `*.test.ts` or `*.spec.ts`.

## Commit & Pull Request Guidelines
No established commit message convention exists yet (only the initial scaffold commit). Use concise, imperative messages (e.g., "Add dashboard layout"). For PRs, include:
- A short summary of changes and motivation
- Screenshots or short clips for UI changes
- Linked issues or tasks when applicable

## Security & Configuration Tips
Store secrets in `.env.local` and keep them out of version control. Avoid committing build artifacts such as `.next/` and `node_modules/` (already ignored).
