<!-- markdownlint-disable MD013 -->

# Context

> Last updated: 2026-05-26

## Project Summary

- Durian orchard management app for Thai users.
- Built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Radix UI, and Supabase.
- Main workflows cover dashboard, plots and trees, tasks, activities, finance, articles, settings, profile, and auth.
- UI copy is mainly Thai and should keep the current agricultural tone.

## Main Directories

- `app/`: Next.js routes, layout, global pages, metadata, and API/callback routes.
- `components/`: main app screens and feature components.
- `components/ui/`: shared shadcn-style UI primitives.
- `lib/`: store, Supabase clients, queries, utilities, SEO, runtime config, validation.
- `hooks/`: shared React hooks.
- `public/`: static assets, images, PWA manifest.
- `supabase/`: SQL schemas and setup scripts.
- `styles/`: global style support where used.

## Important Files

- `PROJECT_KNOWLEDGE.md`: primary project knowledge and architecture notes.
- `components/AppShell.tsx`: main client shell and app navigation.
- `components/AuthModal.tsx`: email, Google, and LINE login UI.
- `lib/store.ts`: app state, localStorage fallback, Supabase sync, and CRUD logic.
- `lib/supabase/client.ts`: browser Supabase client.
- `lib/supabase/server.ts`: server Supabase client.
- `app/auth/callback/route.ts`: OAuth callback and code exchange.
- `app/globals.css`: global theme tokens and styling.

## Data And Auth

- Data mode is controlled by `NEXT_PUBLIC_APP_DATA_MODE`.
- Supabase project id currently referenced in docs: `hpyoyjpqitpvgckxnlww`.
- `localStorage` key: `durian_orchard_data`.
- OAuth providers currently include Google and custom LINE via `custom:line`.
- LINE provider setup expects Supabase Custom Provider ID `line`.
- Owner-scoped tables rely on profile/email mapping through Supabase RLS.

## Commands

- Install: use the existing lockfile intentionally; do not rewrite lockfiles casually.
- Dev: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`
- Test: no `test` script is defined.

## Working Rules

- Keep changes small and scoped.
- Read `PROJECT_KNOWLEDGE.md` before broad repo changes.
- Preserve existing UI patterns, component structure, and TypeScript types.
- Prefer existing UI components and utilities before adding new abstractions.
- Do not edit unrelated files.
- Run `npm run lint` after code changes when practical.
- Run `npm run build` only for routing, Next config, data loading, shared component changes, or when requested.
