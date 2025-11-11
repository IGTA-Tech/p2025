# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + Vite + Tailwind CSS single-page application called the "Democratic Accountability Platform". It's a demonstration UI for a political intelligence platform that collects citizen stories about policy impacts, verifies them using AI, and provides creative services to political campaigns.

## Development Commands

### Local Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (usually http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build locally
```

### Deployment (Vercel)
```bash
vercel              # Deploy to Vercel
vercel deploy --prod # Deploy to production
```

## Architecture

### Component Structure
The application consists of a single main component: `DemocraticAccountabilityPlatform.jsx` (1093 lines)

**Entry point flow:**
- `main.jsx` → `App.jsx` → `DemocraticAccountabilityPlatform.jsx`

**Main component (`DemocraticAccountabilityPlatform.jsx`):**
- Contains all data models inline (policyAreas, citizenStories, clientAccounts, creativeTemplates)
- Manages state with React hooks (useState, useEffect, useMemo)
- Renders 4 main view sections based on `activeView` state:
  1. `renderCitizenPortal()` - Form for citizens to submit stories
  2. `renderClientDashboard()` - Intelligence dashboard showing verified stories
  3. `renderCreativeServices()` - AI-powered creative/ad generation services
  4. `renderBusinessIntelligence()` - Revenue and client metrics dashboard

### Key Features
- Real-time metrics simulation (updates every 8 seconds via useEffect interval)
- Story filtering by policy area and search query (useMemo)
- Live notifications system
- Modal story detail view
- Responsive grid layouts with Tailwind CSS

### Data Models
All data is currently hardcoded in the component:
- **policyAreas**: 8 policy categories (education, healthcare, employment, etc.)
- **citizenStories**: Sample citizen impact stories with AI verification scores
- **clientAccounts**: Sample political organizations using the platform
- **creativeTemplates**: Pre-generated ad campaign templates

### Styling
- **Tailwind CSS** for all styling (configured in `tailwind.config.js`)
- **PostCSS** for processing (configured in `postcss.config.js`)
- **lucide-react** for all icons
- Global styles in `src/index.css`

### Build Configuration
- **Vite**: Modern build tool with HMR
- **@vitejs/plugin-react**: Fast Refresh support
- SPA routing handled via `vercel.json` rewrites

## Development Patterns

### Adding New Features
When extending the application:
1. State management is centralized in the main component - add new useState hooks there
2. New views should follow the pattern: `render[ViewName]()` function that returns JSX
3. Navigation buttons are in the top navbar - update the button handlers and activeView state
4. New data models can be added as constants at the top of `DemocraticAccountabilityPlatform.jsx`

### Styling Conventions
- Use Tailwind utility classes exclusively
- Color scheme: blue (primary), green (verified/revenue), purple (creative), orange/red (alerts)
- Spacing: consistent use of gap-* and p-* for padding/spacing
- Cards: `bg-white rounded-lg shadow-sm border`

### Component Patterns
- Conditional rendering based on `activeView` state in the main render
- Icon components imported from lucide-react and used inline
- Grid layouts for metrics: `grid grid-cols-{n} gap-{n}`
