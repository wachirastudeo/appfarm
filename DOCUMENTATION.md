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
All styling is controlled through CSS variables defined in `app/globals.css`:

**Colors:**
- `--background`: `#e9f0df` (sage green)
- `--foreground`: `#111811` (dark green-black)
- `--primary`: `#000000` (black)
- `--secondary`: `#fbb75c` (orange)
- `--accent`: `#6eb85c` (brand green)
- `--destructive`: `#ef4444` (red)
- `--border`: `#d2e0c5` (subtle sage border)
- `--ring`: `#6eb85c` (focus outline)

**Sidebar Colors:**
- `--sidebar`: Light sage green background
- `--sidebar-primary`: Black for active states
- `--sidebar-accent`: Muted light background
- `--sidebar-border`: Subtle borders

**Chart Colors:**
- `--chart-1`: Brand green
- `--chart-2`: Brand orange
- `--chart-3`: Black

**Radius:**
- `--radius`: `1.5rem` (friendly rounded corners)
- Calculated variants: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`

### Theme Implementation
- Light mode is the default with warm, nature-inspired colors
- Dark mode support available via next-themes
- All colors use OKLCH color space for better color consistency
- CSS variables are defined at `:root` level for easy customization

### Tailwind CSS Integration
- Tailwind CSS processes all component styles
- Theme tokens are mapped to Tailwind color utilities
- PostCSS handles CSS variable injection and processing
- Custom utilities available: `scrollbar-hide`, `safe-area-bottom`

## Core Modules

### 1. Plot & Tree Management (`PlotManagement.tsx`)
Handles creation and tracking of orchard plots. Includes:
- Bulk management capabilities
- Individual tree tracking (variety, health status, coordinates)
- Status indicators using semantic colors (green/orange/red)

### 2. Activity Logging (`ActivityLog.tsx`)
Rapid data entry module designed for field use. Features:
- Optimized forms with large touch targets
- Support for logging fertilizing, spraying, irrigation activities
- Integration with task planner for completion tracking

### 3. Task Planner (`TaskPlanner.tsx`)
Scheduling interface for upcoming orchard tasks. Provides:
- Task creation and management
- Integration with activity log
- Status tracking with visual indicators

### 4. Financial Records (`Finance.tsx`)
Tracks orchard profitability through:
- Harvest income records
- Supply expense tracking
- Profitability summary view

### 5. Dashboard (`Dashboard.tsx`)
Overview screen displaying:
- Summary of trees and plots
- Recent activities
- Upcoming tasks
- Financial summary

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
