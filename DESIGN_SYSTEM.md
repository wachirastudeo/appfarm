# Design System: Durian Orchard Management

## Overview
This document outlines the visual identity and design tokens for the Durian Orchard Management application. The design prioritizes a clean, nature-inspired interface with excellent outdoor visibility and accessibility for mobile use in field conditions.

## Typography
The application uses **Geist** and **Geist Fallback** as the primary typeface for Latin characters, with support for Thai text through the system font stack. This ensures excellent readability for both Thai and English characters.
- **Headings**: Bold and high-contrast, establishing clear visual hierarchy.
- **Body Text**: Regular weight, optimized for legibility and comfortable reading.
- **Monospace**: Geist Mono for code and technical content.

## Color Palette

### Light Mode (Default)
The application uses a warm, plant-inspired color scheme designed for outdoor use.

#### Primary Colors
- **Background**: `#e9f0df` - Soft sage green, reduces glare in outdoor lighting
- **Text Primary**: `#111811` - Dark green-black for high contrast
- **Text Secondary**: `#5c6b5c` - Medium muted green for helper text
- **Cards & Surface**: `#ffffff` - Pure white for content surfaces

#### Brand & Interactive Colors
- **Brand Green (Accent)**: `#6eb85c` - Primary accent for icons, active states, and key highlights
- **Brand Orange (Secondary)**: `#fbb75c` - Secondary action buttons and highlights
- **Brand Black (Primary)**: `#000000` - Primary buttons and strong actions
- **Muted**: `#e1ecd3` - Light background for disabled/secondary states

#### Status & Semantic Colors
- **Status Good**: `#6eb85c` - Green for healthy trees, completed tasks
- **Status Warning**: `#fbb75c` - Orange for pending items or minor issues
- **Status Danger**: `#ef4444` - Red for errors, missed schedules, or critical issues

#### Border & Ring Colors
- **Border**: `#d2e0c5` - Subtle borders matching the sage theme
- **Input**: `#ffffff` - White input backgrounds
- **Ring**: `#6eb85c` - Focus ring color (brand green)

### Dark Mode
Dark mode inverts the color scheme while maintaining semantic meanings:
- **Background**: Dark charcoal
- **Surface**: Dark slate
- **Text**: Light off-white
- **Accent**: Cyan/bright colors for visibility

## CSS Variables & Tokens

All colors are defined as CSS variables in `app/globals.css` for consistent theming:

```css
--background: #e9f0df
--foreground: #111811
--card: #ffffff
--primary: #000000
--primary-foreground: #ffffff
--secondary: #fbb75c
--secondary-foreground: #111811
--accent: #6eb85c
--accent-foreground: #ffffff
--destructive: #ef4444
--border: #d2e0c5
--ring: #6eb85c
```

## Component Guidelines

### Buttons
- **Primary Button**: Black background (`#000000`) with white text. Minimum height of 48px for touchscreen accessibility.
- **Secondary Button**: Orange background (`#fbb75c`) with dark text for secondary actions.
- **Accent Button**: Green background (`#6eb85c`) with white text for highlights.
- **Ghost/Text Button**: Transparent background with text only, used for less prominent actions.
- **Focus State**: Green ring (2-3px) using `--ring` color.

### Forms & Inputs
- **Input Fields**: White background with sage borders. Expands to full focus ring on interaction.
- **Focus State**: Green ring outline and border change to accent color.
- **Checkboxes/Switches**: Scaled for easy interaction, accent green when checked.
- **Disabled State**: Muted background (`#e1ecd3`) with muted text.

### Cards & Layout
- **Cards**: White background with subtle borders and rounded corners (1.5rem radius).
- **Spacing**: Generous padding and margins to prevent clutter and accidental taps.
- **Border Radius**: `--radius: 1.5rem` for a friendly, modern appearance.
- **Shadows**: Minimal, used only for depth emphasis in modals and dropdowns.

### Status Indicators
- **Healthy/Success**: Brand green (`#6eb85c`)
- **Warning/Pending**: Brand orange (`#fbb75c`)
- **Error/Danger**: Red (`#ef4444`)

## Mobile-First Design Approach
- All interfaces designed for mobile screens first, with responsive scaling for larger devices.
- **Touch Targets**: Minimum 48px height for buttons and interactive elements.
- **Navigation**: Tab-based bottom navigation for easy thumb access.
- **Modals & Drawers**: Full-height mobile display with smooth slide-up animations.
- **Forms**: Optimized for field use with large inputs and minimal scrolling.

## Sidebar Theming
- **Background**: `#e9f0df` - Matches main background
- **Primary**: `#000000` - Black for active sidebar items
- **Accent**: `#e1ecd3` - Light muted for hover states
- **Border**: `#d2e0c5` - Subtle borders between items

## Chart & Data Visualization
- **Chart Color 1**: `#6eb85c` - Brand green for primary data
- **Chart Color 2**: `#fbb75c` - Brand orange for secondary data
- **Chart Color 3**: `#000000` - Black for tertiary data
