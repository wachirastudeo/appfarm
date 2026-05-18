# Design System: Durian Orchard Management

## Overview
This document outlines the visual identity and design tokens for the Durian Orchard Management application. The design uses a **Modern Nature UI** aesthetic, combining deep forest greens and muted natural tones to create a premium, high-visibility interface optimized for both outdoor field conditions and professional management.

## Typography
The application uses a high-visibility typography system with a base size of **20px** for excellent readability on mobile devices.
- **Primary Typeface**: Geist / Inter (San-serif)
- **Thai Support**: Optimized system font stack for Thai legibility
- **Hierarchy**: Strong contrast between bold headings and readable body text

## Color Palette: Modern nature UI

### Light Mode (Outdoor High-Visibility)
- **Background**: `#F2F8F4` - Soft mint tint, reduces high-glare outdoor strain.
- **Foreground**: `#143422` - Deep forest-black green for sharp legibility.
- **Card Surface**: `#ffffff` - Crisp clean white for high contrast content separation.
- **Muted Section**: `#E7F3EC` - Gentle sage for background highlight regions.
- **Primary / Brand**: `#146B3E` - Bright forest green representing lush cultivation.
- **Secondary**: `#54745f` - Muted olive-green for descriptive text or metadata.
- **Border**: `#c9dacd` - Crisp green-tinted boundary dividers.

### Dark Mode (Low-Light Night Care)
- **Background**: `#0F1F17` - Premium dark night-green background.
- **Foreground**: `#EAF6ED` - High-contrast off-white green text.
- **Card Surface**: `#14291E` - Deep dark green container panels.
- **Muted Section**: `#1D3A29` - Darker forest-green highlighting.
- **Primary / Accent**: `#72C08A` - Energetic light mint green for prominent interactive highlights.
- **Secondary**: `#375B43` - Muted olive for low-priority details.
- **Border**: `#31533D` - Subdued green border boundaries.

### Status & Semantic Colors
- **Status Good**: Forest Green (`#146B3E` in Light, `#72C08A` in Dark)
- **Status Warning**: Amber / Gold (`#f59e0b`)
- **Status Danger**: Destructive Crimson (`#dc2626` in Light, `#ef4444` in Dark)

## Typography & Visibility Scales
The application implements an **enhanced mobile-first typography scale** with a base readability size starting at **20px** (`1.25rem`) on larger viewports.
- **Base (Base/20px)**: `1.25rem` / Line height: `1.875rem` (optimized for fast reading in high-glare environments).
- **Sub-text (SM/19px)**: `1.1875rem` / Line height: `1.75rem`
- **Mini-text (XS/18px)**: `1.125rem` / Line height: `1.75rem`
- **Title hierarchy**: Up to `5xl` (`2.5rem`) for key metrics.
- **Fonts**: Pre-optimized font stack leveraging the custom `--font-thai` system stack blended with Geist / Inter.

## Layout & Components

### Corner Radius
- **Base Radius**: `0.75rem` (12px) for general inputs, buttons, and alert-dialog blocks.
- **Premium Cards**: `2.5rem` (40px) or standard `orchard-card` classes with tailored hover effects, subtle translations, and glowing nature shadows.

### Skeleton Loaders
Asynchronous visual blocks with soft pulses built in for smooth transition states during background fetching (e.g. weather data updates, location place search).

## CSS Tokens (`app/globals.css`)
```css
:root {
  --background: #F2F8F4;
  --foreground: #143422;
  --card: #ffffff;
  --primary: #146B3E;
  --secondary: #54745f;
  --muted: #E7F3EC;
  --border: #c9dacd;
  --radius: 0.75rem;
}

.dark {
  --background: #0F1F17;
  --foreground: #EAF6ED;
  --card: #14291E;
  --primary: #72C08A;
  --secondary: #375B43;
  --muted: #1D3A29;
  --border: #31533D;
}
```
