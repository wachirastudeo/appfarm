# AGENTS.md

## Project
- Next.js + TypeScript app.
- Main app code lives in `app/`, shared UI in `components/`, utilities in `lib/`, hooks in `hooks/`, static assets in `public/`, and global styles in `styles/`.
- Read `PROJECT_KNOWLEDGE.md` first for project context before scanning the whole repo.

## Commands
- Install: prefer the package manager matching the lockfile you intentionally use; do not rewrite lockfiles casually.
- Dev: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`
- Test: no `test` script is defined in `package.json` right now.

## Response style
- Reply in English.
- Keep answers short and direct.
- Do not over-explain unless asked.
- Use bullet points only when useful.
- Summarize changes in 2 bullets max.

## When changing code
At the end, summarize only:
1. What changed
2. Files changed
3. Tests run

## If something cannot be done
- Explain briefly why.
- Suggest the next best step.

## Rules
- Keep changes small.
- Do not edit unrelated files.
- Do not delete files unless asked.
- Explain what changed.
- Run tests when relevant.
- Preserve existing UI patterns, component structure, and TypeScript types.
- Prefer existing components and utilities before adding new abstractions.
- Keep user-facing text consistent with the app's current language and tone.
- For UI changes, check responsive behavior and avoid layout shifts or overlapping text.
- Run `npm run lint` after code changes when practical.
- Run `npm run build` for changes that affect routing, Next.js config, data loading, or shared components.
- If verification cannot be run, state the reason and what should be run next.
