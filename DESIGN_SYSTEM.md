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
The application uses a "Restored Bright Nature UI" palette, focusing on fresh greens and vibrant oranges for high outdoor visibility.

#### Primary Colors
- **Background**: `#f8faf5` - Soft fresh green background, reduces glare
- **Text Primary**: `#111811` - Dark green-black for high contrast
- **Text Secondary**: `#5c6b5c` - Medium muted green for helper text
- **Cards & Surface**: `#ffffff` - Pure white for content surfaces

#### Brand & Interactive Colors
- **Brand Green (Primary)**: `#559e45` - Primary accent for icons, active states, and buttons
- **Brand Orange (Secondary)**: `#fbb75c` - Vibrant orange for secondary highlights
- **Brand Black (Tertiary)**: `#111811` - Used for strong visual contrast in typography and UI elements
- **Muted**: `#edf3e8` - Light fresh green for secondary states and backgrounds

#### Status & Semantic Colors
- **Status Good**: `#559e45` - Green for healthy trees, completed tasks
- **Status Warning**: `#fbb75c` - Orange for pending items or minor issues
- **Status Danger**: `#ef4444` - Red for errors, missed schedules, or critical issues

#### Border & Ring Colors
- **Border**: `#e1e9d9` - Clean borders matching the fresh theme
- **Input**: `#ffffff` - White input backgrounds
- **Ring**: `#559e45` - Focus ring color (brand green)

### Dark Mode
Dark mode inverts the color scheme while maintaining semantic meanings:
- **Background**: Dark charcoal
- **Surface**: Dark slate
- **Text**: Light off-white
- **Accent**: Cyan/bright colors for visibility

## CSS Variables & Tokens

All colors are defined as CSS variables in `app/globals.css` for consistent theming:

```css
--background: #f8faf5
--foreground: #111811
--card: #ffffff
--primary: #559e45
--primary-foreground: #ffffff
--secondary: #fbb75c
--secondary-foreground: #ffffff
--accent: #559e45
--accent-foreground: #ffffff
--destructive: #ef4444
--border: #e1e9d9
--ring: #559e45
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
- **Minimalist Aesthetic**: Clean, high-performance design stripped of unnecessary flourishes like faded text or large decorative elements.
- **Sharp Edges**: No rounded corners (0px radius) for a professional, precise, and compact look.
- **Spacing**: Compact layouts optimized for high information density while maintaining legibility.
- **Border Radius**: `--radius: 0px` (Strictly sharp edges across all components).
- **Shadows**: Minimal to none, relying on borders and color contrast for depth.

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
- **Background**: `#f8faf5` - Matches main background
- **Primary**: `#559e45` - Brand green for active sidebar items
- **Accent**: `#edf3e8` - Light fresh hover states
- **Border**: `#e1e9d9` - Precise borders between items

## Chart & Data Visualization
- **Chart Color 1**: `#559e45` - Brand green for primary data
- **Chart Color 2**: `#fbb75c` - Brand orange for secondary data
- **Chart Color 3**: `#111811` - Dark green-black for tertiary data
