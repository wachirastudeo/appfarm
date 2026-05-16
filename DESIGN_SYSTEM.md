# Design System: Durian Orchard Management

## Overview
This document outlines the visual identity and design tokens for the Durian Orchard Management application. The design uses a **Modern Nature UI** aesthetic, combining deep forest greens and muted natural tones to create a premium, high-visibility interface optimized for both outdoor field conditions and professional management.

## Typography
The application uses a high-visibility typography system with a base size of **20px** for excellent readability on mobile devices.
- **Primary Typeface**: Geist / Inter (San-serif)
- **Thai Support**: Optimized system font stack for Thai legibility
- **Hierarchy**: Strong contrast between bold headings and readable body text

## Color Palette: Modern Nature UI

### Primary Colors
- **Background**: `#fafbf8` - Clean warm white, reduces outdoor glare
- **Foreground**: `#1a2e1a` - Deep forest green for maximum text contrast
- **Card Surface**: `#ffffff` - Pure white for content areas
- **Muted**: `#f0f4ed` - Light sage for background sections and hover states

### Brand & Interactive Colors
- **Forest Green (Primary)**: `#1a3320` - Primary action color, icons, and active states
- **Muted Green (Secondary)**: `#4c6a54` - Secondary highlights and subdued elements
- **Destructive**: `#dc2626` - Standard red for critical errors and deletions

### Status & Semantic Colors
- **Status Good**: `#1a3320` (Forest Green)
- **Status Warning**: `#f59e0b` (Amber/Orange)
- **Status Danger**: `#dc2626` (Bright Red)

## Layout & Components

### Corner Radius
The application uses a premium **rounded aesthetic** to feel approachable yet professional.
- **Base Radius**: `0.75rem` (12px)
- **Premium Cards**: Up to `2.5rem` (40px) for major layout containers like the Plot Detail view.

### Split-View Navigation (Desktop)
- **2-Column Layout**: A persistent sticky sidebar on the left for navigation/listing, with a spacious detail pane on the right.
- **Responsive Transition**: On mobile devices, the layout automatically switches to a focused 1-column view (list-to-detail) to maximize screen real estate.

### Buttons & Interaction
- **Primary Buttons**: High-contrast with `--primary` or `--foreground` backgrounds.
- **Touch Targets**: Minimum **48px** height for all interactive elements to ensure reliable field use.
- **Micro-interactions**: Subtle hover effects and scale transitions (`active:scale-95`) for tactile feedback.

## CSS Tokens (`app/globals.css`)
```css
--background: #fafbf8;
--foreground: #1a2e1a;
--primary: #1a3320;
--secondary: #4c6a54;
--radius: 0.75rem;
```
