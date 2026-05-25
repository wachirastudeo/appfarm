<!-- markdownlint-disable MD013 -->

# Durian Orchard Management App - Feature Checklist

> Last updated: 2026-05-26

This checklist outlines the missing features and potential improvements identified during the system analysis of the durian orchard management application.

---

## 🚀 1. Data Persistence & Backend Integration

- [x] **Database Setup**: Supabase Postgres tables are created and seeded/backfilled. Main schema file: `supabase/appfarm_database_schema.sql`.
- [x] **Structured Data Sync**: Core app data syncs to `profiles`, `plots`, `trees`, `tasks`, `activities`, `finance_records`, `articles`, `products`, and `site_settings`, while `app_data` remains as JSON backup/fallback.
- [x] **Owner-Scoped Orchard Data**: `plots`, `trees`, `batches`, `batch_stages`, `tasks`, `activities`, and `finance_records` load/save by logged-in user.
- [x] **RLS Hardening for Orchard Data**: Main schema defines owner-only policies for authenticated orchard data tables.
- [ ] **Multi-User & Staff Access**: Implement role-based access control (RBAC) allowing orchard owners to assign limited view/edit permissions to field staff.
- [x] **Secure Google Authentication**: Google Login is connected through Supabase Auth.
- [ ] **Staff Access / RBAC Hardening**: Extend roles beyond owner-only access for field staff or admins.

## 🗺️ 2. Geographic & Map Visualizations (GIS)

- [ ] **Visual Orchard Layout**: Add an interactive grid/map (e.g., via Leaflet/MapLibre) to plot tree coordinate pins and visually track health statuses.
- [ ] **Location-based Weather Mapping**: Automatically fetch coordinates using GPS instead of manual text-based place search.

## 📊 3. Finance & Yield Analytics

- [x] **Dynamic Charts**: Finance includes Recharts summaries for income vs. expense trends and category breakdown.
- [ ] **Exportable Reports**: Generate PDF/CSV reports for financial audits, crop sales, and task completions.
- [ ] **Weight & Grade Logs**: Track crop yield weight and grade classifications (Grade A, B, C) per harvest batch.

## 📅 4. Smart Cultivation & Stage Scheduler

- [ ] **Growth Stage Reminders**: Automatic notifications when trees transition between critical stages (e.g., from *bloom* to *rat_tail*).
- [ ] **Smart Water/Fertilizer Guide**: Suggest watering and fertilizing volume/formulas dynamically based on current weather forecasts and growth stages.

## 📶 5. Offline Capabilities & PWA Enhancements

- [ ] **Offline Sync Queue**: Enable adding tasks, finance records, and activities offline, syncing changes to the backend once a stable internet connection is restored.
- [ ] **Service Worker Optimization**: Cache static assets and recent database entries for reliable field use in low-signal areas.
