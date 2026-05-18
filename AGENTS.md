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
- Always reply in English.
- Keep answers short and direct by default.
- Prefer very short final replies: say it is done, list only essential changed files/tests, then stop.
- Do not over-explain unless explicitly asked.
- Use bullet points only when useful.
- Summarize changes in 2 bullets max.
- Do not attach screenshots unless the user asks to see one.

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
- Do not run `npm run build` every time; run it only when the change affects routing, Next.js config, data loading, or shared components, or when the user asks.
- If verification cannot be run, state the reason and what should be run next.
