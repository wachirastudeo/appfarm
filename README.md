<!-- markdownlint-disable MD013 -->

# Durian Orchard Management App

> Last updated: 2026-05-26

## Overview

A modern, mobile-responsive web application designed for managing durian orchards. The application helps orchard owners and workers track plots, manage trees, log daily agricultural activities (such as fertilizing, spraying, and irrigation), plan tasks, and maintain financial records.

## Features

- **Dashboard**: High-level overview of orchard status, upcoming tasks, recent activities, personalized user greeting, **farm location setting** (integrated with OpenStreetMap API), and **5-day daily weather forecast** (via Open-Meteo API) with loading skeletons.
- **Plot & Tree Management**: Advanced dual-pane management for plots and individual trees with a desktop split-view and mobile list-to-detail flow. Includes **plot deletion with confirmation safety** and **bulk tree addition with automatic sequential numbering** (e.g. A-001, A-002).
- **Tree Lifecycle Tracking**: Detailed records for individual trees including variety, age, health status, and fruit batch tracking with harvest predictions.
- **Activity Logging**: Easy-to-use interfaces for recording fieldwork like spraying, fertilizing, and watering.
- **Task Planner**: Scheduling and tracking of agricultural tasks.
- **Financial Tracking**: Monitoring expenses and income related to orchard operations with interactive filtering by type (income/expense).
- **Knowledge Base**: Searchable articles and educational content on durian cultivation techniques, pest management, and market trends with modal-based article viewing.
- **Dark Mode Theme**: Premium Nature Dark UI optimized for low-light night conditions.
- **Progressive Web App (PWA)**: Support for dark mode styling, standalone add-to-home-screen install prompts, and standard `manifest.webmanifest` assets for mobile packaging.
- **Authentication & Custom Profile**: Email login plus Supabase Google Login, editable profile details, Google/profile avatar display, and avatar upload with live preview.
- **Supabase Database Mode**: Stores orchard data in Supabase Postgres owner-scoped tables with `app_data` JSON backup/fallback and browser `localStorage` cache.

## Technology Stack

- **Framework**: Next.js 16.2.4 (App Router)
- **UI Library**: React 19
- **Theme Manager**: next-themes
- **Styling**: Tailwind CSS v4, PostCSS
- **Components**: Radix UI primitives, Lucide Icons
- **Language**: TypeScript
- **Database**: Supabase Postgres (`profiles`, `plots`, `trees`, `batches`, `batch_stages`, `tasks`, `activities`, `finance_records`, `articles`, `products`, `site_settings`, `app_data`)

## Database Docs

- Human-readable table map: `SUPABASE_DATABASE_MAP_TH.md`
- Main database schema file: `supabase/appfarm_database_schema.sql`
- Supabase setup guide: `SUPABASE_SETUP_TH.md`

Current project id: `hpyoyjpqitpvgckxnlww`

Security note: orchard data tables (`plots`, `trees`, `batches`, `batch_stages`, `tasks`, `activities`, `finance_records`) are scoped by authenticated owner policies. Shared content tables (`articles`, `products`, `site_settings`) remain global.

## Getting Started

### Prerequisites

- Node.js (v20.9+)
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository or navigate to the project directory:

   ```bash
   cd appfarm
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   pnpm install
   ```

### Running the Application

Start the development server:

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Data Mode

Cloudflare is deployed at [appfarm.wachira-appfarm.workers.dev](https://appfarm.wachira-appfarm.workers.dev): see [คู่มือ Cloudflare ภาษาไทย](CLOUDFLARE_SETUP_TH.md). `npm run build` builds the Workers application with vinext; `npm run dev:cloudflare` tests real D1/auth locally. The Cloudflare runtime does not connect to Supabase. Old private data has not been migrated.

`npm run dev` always runs a local demo, even when `.env.local` contains Supabase credentials. Register an email account in the app to test login and orchard features. Demo records and login use separate `demo_` browser storage keys; Google/LINE login and Supabase access are disabled in this mode. Weather and place search still require internet access.

The legacy Supabase implementation remains for rollback only. Its previous configuration was:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

For Cloudflare, configure `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and the optional OAuth provider secrets as described in the Thai guide. Set `NEXT_PUBLIC_SITE_URL` to the deployed website URL before building. Cloudflare email authentication uses D1 and never falls back to demo passwords.

Run `npm run build` then `npm start` to preview the Cloudflare Worker locally. Public environment settings are fixed at build time; changing them requires rebuilding. Keep using `npm run dev` for isolated browser demo testing.

Check mode separation with `npm run test:modes` (Node.js 22.18 or newer).

## Build for Production

```bash
npm run build
npm run start
```
