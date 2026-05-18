# Project Documentation

## Architecture Overview
The application is built using the **Next.js App Router** paradigm with **Tailwind CSS** for styling. It emphasizes Server Components by default with explicit Client Components where interactivity is required.

## Technology Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS with PostCSS
- **Theme Management**: next-themes for light/dark mode support
- **Component Library**: Radix UI primitives with custom extensions
- **Icons**: Lucide React
- **Language Support**: Multi-language support with Thai as primary language

## Directory Structure

### `/app`
Contains the Next.js routing logic, page components, and layouts.
- `layout.tsx`: Root layout wrapping all pages with theme provider
- `page.tsx`: Main dashboard entry point
- `globals.css`: Global CSS variables, theme definitions, and Tailwind configuration

### `/components`
Contains reusable UI elements and feature-specific components.
- **Feature Components** (`ActivityLog.tsx`, `Dashboard.tsx`, `Finance.tsx`, `PlotManagement.tsx`, `TaskPlanner.tsx`): Large, stateful components that handle specific domains of the application.
- **`/ui`**: Foundational UI components (buttons, inputs, dialogs, etc.) built on top of Radix UI primitives. These are highly reusable and adhere to the Design System.
- `theme-provider.tsx`: Theme provider wrapper using next-themes
- `AppShell.tsx`: Main application layout with tab-based navigation

### `/lib`
Utility functions, constants, and shared logic.
- `store.ts`: Application state management
- `utils.ts`: Helper functions

### `/hooks`
Custom React hooks for managing complex state or side effects across multiple components.
- `use-mobile.ts`: Mobile viewport detection hook
- `use-toast.ts`: Toast notification hook

### `/styles`
Global stylesheet definitions.

## Styling & Theme System

### CSS Variables
All styling is controlled through CSS variables defined in `app/globals.css` with adaptive next-themes mapping:

**Light Mode Colors:**
- `--background`: `#F2F8F4` (soft outdoor glare-reducing mint white)
- `--foreground`: `#143422` (deep forest green text)
- `--card`: `#ffffff` (crisp white panel)
- `--primary`: `#146B3E` (lush cultivation forest green)
- `--secondary`: `#54745f` (subdued olive-green)
- `--muted`: `#E7F3EC` (light sage)
- `--border`: `#c9dacd` (subtle mint border lines)

**Dark Mode Colors (`.dark`):**
- `--background`: `#0F1F17` (deep dark nature green)
- `--foreground`: `#EAF6ED` (high-contrast off-white green text)
- `--card`: `#14291E` (deep forest dark green cards)
- `--primary`: `#72C08A` (mint accent highlight green)
- `--secondary`: `#375B43` (muted night olive)
- `--muted`: `#1D3A29` (subtle dark green highlighting)
- `--border`: `#31533D` (dark green borders)

**Sidebar Theme Variables:**
- Light: `--sidebar`: `#146B3E`, `--sidebar-foreground`: `#eaf6ed`, `--sidebar-accent`: `#0F5A34`.
- Dark: `--sidebar`: `#102619`, `--sidebar-foreground`: `#EAF6ED`, `--sidebar-accent`: `#1D3A29`.

### Typography & Readability Scale
Designed specifically for agricultural operators working in unpredictable outdoor light conditions:
- **Base Readable Scale**: Desktop starts at **20px** (`1.25rem`) base size to prevent eye fatigue.
- **Custom font-sizes**: XS (`18px`), SM (`19px`), Base (`20px`), LG (`22px`), XL (`24px`), XXL (`28px`), 3XL (`32px`), 4XL (`36px`), 5XL (`40px`).
- **Font Stack**: Leverages native Thai legibility optimizations combined with Geist and Inter.

### Progressive Web App (PWA) & Skeletons
- Standard `manifest.webmanifest` assets located in `/public`.
- Standalone PWA installation handling prompts mapped to UI modal cues.
- Seamless CSS skeleton pulsing layouts implemented via custom Tailwind animations to buffer latency in remote field connections.

## Core Modules

### 1. Plot & Tree Management (`PlotManagement.tsx`)
Handles creation and tracking of orchard plots. Features:
- **Split-View Desktop Layout**: 2-column interface with a sticky plot list on the left and a detailed view on the right.
- **Mobile Optimized**: Seamless 1-column list-to-detail flow with responsive visibility logic.
- **Tree Lifecycle**: Tracking of flower stages (vegetative to harvest) with batch-level fruit counting.
- **Harvest Prediction**: Automatic calculation of harvest dates based on bloom data (120-day cycle).
- **QR Code Integration**: Support for individual and batch QR code generation for field tracking.
- **Plot Deletion**: Delete plots easily with custom dialog safety confirmations to avoid accidental loss.
- **Bulk Tree Addition**: Built-in tree numbering generators enabling automated addition of sequential trees (e.g. A-001 to A-010) in a single action.

### 2. Activity Logging (`ActivityLog.tsx`)
Rapid data entry module designed for field use. Features:
- Optimized forms with large touch targets
- Support for logging fertilizing, spraying, irrigation activities
- Integration with task planner for completion tracking
- Filterable activity history by type

### 3. Task Planner (`TaskPlanner.tsx`)
Scheduling interface for upcoming orchard tasks. Provides:
- Interactive calendar with visual task indicators
- **Date Synchronization**: Task list automatically updates based on selected calendar date
- Task creation with automatic calendar focus on the new task's date
- Status tracking with visual indicators (pending/done/cancelled)
- Integrated task editing and deletion

### 4. Financial Management (`Finance.tsx`)
Comprehensive financial tracking and analysis. Features:
- Record income and expenses with categorization
- Interactive filtering by transaction type (income/expense/all) via clickable summary cards
- Expense breakdown pie chart by category
- Monthly income vs. expense trend analysis
- Profitability summary with real-time calculations

### 5. Knowledge Base (`Articles.tsx`)
Educational content repository for orchard management. Features:
- Searchable article database on cultivation techniques, pest management, and market trends
- Real-time article filtering by search term and category
- Modal-based article viewing with full content display
- Reading time estimates for each article
- No results handling with helpful empty state

### 6. Dashboard (`Dashboard.tsx`)
High-visibility main dashboard screen displaying:
- **Personalized Greetings**: Custom greetings welcoming users based on app state profile configurations.
- **Farm Location Manager**: In-app farm coordination editor utilizing the OpenStreetMap Nominatim API for instant place lookups.
- **5-Day Weather Forecasts**: Real-time daily weather forecasts fetching from the Open-Meteo API with loading skeletons and custom warnings.
- Summary of trees and plots
- Recent activities
- Upcoming tasks
- Financial summary

### 7. Profile Customization (`ProfileModal.tsx`)
Personalized user profile card allowing:
- **Avatar Uploads**: Live local avatar selection and crop preview displaying dynamic changes immediately.
- **Name Customization**: Easy inline name updates saving to client state immediately.
- **Security Dashboard**: Visual readout indicating roles (admin/user) and account status logs.

## Development Workflows

### Creating a New Page
1. Add a new directory under `/app` (e.g., `/app/reports`).
2. Create a `page.tsx` inside that directory.
3. Import and compose necessary components from `/components`.
4. Use CSS variables and Tailwind classes for consistent styling.

### Creating a New Component
1. Create component file in `/components/ui` for reusable UI elements
2. Use Radix UI as base for interactive components
3. Apply Tailwind classes using design system colors
4. Ensure 48px minimum height for touch targets

### Modifying the Design System
1. Update CSS variables in `app/globals.css` for core token changes
2. Update individual components in `/components/ui` for structural changes
3. Test both light and dark modes
4. Document changes in `DESIGN_SYSTEM.md`

## UI Components Available

The `/components/ui` directory contains comprehensive component library:
- **Layout**: `card.tsx`, `sidebar.tsx`, `sheet.tsx`, `drawer.tsx`
- **Forms**: `input.tsx`, `form.tsx`, `field.tsx`, `button.tsx`, `checkbox.tsx`, `radio-group.tsx`, `select.tsx`
- **Data Display**: `table.tsx`, `pagination.tsx`, `chart.tsx`, `badge.tsx`
- **Navigation**: `breadcrumb.tsx`, `tabs.tsx`, `navigation-menu.tsx`, `menubar.tsx`
- **Feedback**: `toast.tsx`, `alert.tsx`, `alert-dialog.tsx`, `dialog.tsx`, `popover.tsx`
- **Visual**: `separator.tsx`, `skeleton.tsx`, `spinner.tsx`, `progress.tsx`

## Interactive Features

### Search & Filter
- **Article Search**: Real-time filtering of articles by title and category in the Knowledge Base
- **Finance Filtering**: Click summary cards to filter transactions by type (income/expense)
- **Activity Filter**: Filter activity log by activity type

### Modal Viewing
- **Article Modal**: Full-screen modal for reading complete article content with formatted styling
- **QR Code Modal**: Display QR codes for individual trees or batch print QR codes
- **Bulk Update Modal**: Modal interface for updating entire plot flower stages at once

## State Management
Currently relies on React's local state (`useState`, `useReducer`) and Context API through `store.ts` for application-wide state. For future scaling, consider:
- React Query for server state and caching
- SWR for data fetching
- Zustand for lightweight global state

## Performance Considerations
- Server Components used by default to reduce bundle size
- Lazy loading for feature components when needed
- CSS utility approach via Tailwind minimizes custom CSS
- Scrollbar hiding utility prevents layout shift
- Safe area padding for notched devices

## Accessibility
- Focus ring colors clearly visible (brand green)
- Minimum touch target size: 48px
- Semantic color usage for status indicators
- Proper contrast ratios maintained across color palette
- Form labels properly associated with inputs
