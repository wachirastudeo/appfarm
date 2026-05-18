# Project Knowledge

## What This App Is
- Durian orchard management web app for Thai users.
- Tracks plots, trees, flower/fruit stages, field activities, tasks, finance records, settings, profile/login UI, and cultivation articles.
- UI text is mainly Thai. Keep new user-facing copy consistent with the current Thai tone unless asked otherwise.
- Integrates **dynamic weather forecasts (Open-Meteo API)** and **farm location lookups (OpenStreetMap API)**.
- Full **Dark Mode** support and **Progressive Web App (PWA)** capability (install handler, manifest assets).

## Tech Stack
- Next.js App Router, React 19, TypeScript.
- Tailwind CSS v4 via PostCSS.
- Radix UI primitives, shadcn-style components in `components/ui/`.
- next-themes for Light and Dark theme toggling.
- Lucide React icons.
- Local client-side persistence through `localStorage`; no backend database currently.

## Important Files
- `app/page.tsx`: renders `AppShell`.
- `app/layout.tsx`: Thai metadata, fonts, viewport, next-themes wrapping, production Vercel Analytics.
- `app/globals.css`: global styles, Light/Dark theme tokens, typography readability scales.
- `components/AppShell.tsx`: main client shell, tab navigation, settings/auth/profile modals, farm location handling.
- `components/ProfileModal.tsx`: personalized profile card, inline name updates, avatar upload with dynamic crop previews.
- `lib/store.ts`: app data types, seed data, localStorage persistence, CRUD functions (plot deletions, sequential bulk addition calculations).
- `public/manifest.webmanifest`: Progressive Web App metadata.
- `components/ui/`: shared reusable UI primitives. Prefer these before creating new controls.
- `public/images/`: durian article/banner assets.

## Main Features
- Dashboard: orchard overview, tasks, activities, personalized greeting, custom farm settings, OSM place finder, and 5-day daily forecast chart view with loading skeleton elements.
- Plot management: plots, trees, bulk stage updates, tree health, fruit/flower batches, **plot deletion with confirmation dialog**, and **bulk addition form sequential auto-numbering trees**.
- Operations: tasks and activity logs with rapid inline type filters.
- Finance: income/expense records with clickable card category filter cards.
- Articles: durian knowledge base using `.avif` assets.
- Profile / Auth: localized credentials, personalized updates, custom profile avatar handling.

## Data Model
- `AppData`: `plots`, `activities`, `tasks`, `finance`, `users`, `articles`, `products`, `siteSettings`.
- `Plot`: has `trees`.
- `Tree`: variety, age, health, current `FlowerStage`, notes, `batches`, `lastUpdated`.
- `FlowerBatch`: fruit count, optional `bloomDate`, stage history.
- `Activity`: date, plot/tree relation, type, description, cost.
- `Task`: date, plot relation, status, priority.
- `FinanceRecord`: income/expense, category, amount, optional plot relation.
- `AppUser`: id, name, email, passwordHash, role, status, provider, avatar image strings, createdAt.

## State And Persistence
- `useAppData()` in `lib/store.ts` owns app state.
- Storage key: `durian_orchard_data`.
- Settings location uses `farm_location` and `farm_location_changed` alongside personalized configuration entries.
- The app is client-heavy; many components use `"use client"`.
- Existing stored data may be older, so keep backward-compatible guards when adding fields (e.g. `batches` or `avatar` string checks).

## Commands
- Dev: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`
- Test: no `test` script exists right now.
- There are both `package-lock.json` and `pnpm-lock.yaml`; avoid touching lockfiles unless dependency work requires it.

## Coding Rules
- Keep changes small and scoped.
- Preserve Thai labels, agricultural terms, and existing UI tone.
- Prefer existing `components/ui` controls and `lib/utils.ts` helpers.
- Keep types in `lib/store.ts` aligned with CRUD functions and component props.
- For UI changes, verify mobile and desktop behavior.
- Support both Light and Dark mode styling perfectly across components.
- Avoid adding backend assumptions unless requested.

## Verification
- Run `npm run lint` for code changes when practical.
- Run `npm run build` for route, shared component, store/type, or Next config changes.
- If verification is skipped, state why.
