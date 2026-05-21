# Durian Orchard Management App - Feature Checklist

This checklist outlines the missing features and potential improvements identified during the system analysis of the durian orchard management application.

---

## 🚀 1. Data Persistence & Backend Integration
- [x] **Database Setup**: Supabase Postgres tables are created and seeded/backfilled. Main schema file: `supabase/appfarm_database_schema.sql`.
- [x] **Structured Data Sync**: Core app data syncs to `profiles`, `plots`, `trees`, `tasks`, `activities`, `finance_records`, `articles`, `products`, and `site_settings`, while `app_data` remains as JSON backup/fallback.
- [ ] **Production RLS Hardening**: Replace prototype `anon` / `authenticated` allow-all policies with Supabase Auth policies or server-side writes before launch.
- [ ] **Multi-User & Staff Access**: Implement role-based access control (RBAC) allowing orchard owners to assign limited view/edit permissions to field staff.
- [ ] **Secure Authentication**: Replace the client-side bcrypt/hash simulation with real OAuth (Google) or Firebase/Supabase Auth.

## 🗺️ 2. Geographic & Map Visualizations (GIS)
- [ ] **Visual Orchard Layout**: Add an interactive grid/map (e.g., via Leaflet/MapLibre) to plot tree coordinate pins and visually track health statuses.
- [ ] **Location-based Weather Mapping**: Automatically fetch coordinates using GPS instead of manual text-based place search.

## 📊 3. Finance & Yield Analytics
- [ ] **Dynamic Charts**: Add visual graphs (bar charts, pie charts) for income vs. expense tracking and category breakdown using Recharts or Chart.js.
- [ ] **Exportable Reports**: Generate PDF/CSV reports for financial audits, crop sales, and task completions.
- [ ] **Weight & Grade Logs**: Track crop yield weight and grade classifications (Grade A, B, C) per harvest batch.

## 📅 4. Smart Cultivation & Stage Scheduler
- [ ] **Growth Stage Reminders**: Automatic notifications when trees transition between critical stages (e.g., from *bloom* to *rat_tail*).
- [ ] **Smart Water/Fertilizer Guide**: Suggest watering and fertilizing volume/formulas dynamically based on current weather forecasts and growth stages.

## 📶 5. Offline Capabilities & PWA Enhancements
- [ ] **Offline Sync Queue**: Enable adding tasks, finance records, and activities offline, syncing changes to the backend once a stable internet connection is restored.
- [ ] **Service Worker Optimization**: Cache static assets and recent database entries for reliable field use in low-signal areas.
