# MyFit

A personal, local-first fitness and weight-loss tracker built as an installable PWA.
**Progress never resets.**

## Stack
React 19 · TypeScript · Vite · Tailwind CSS v4 · Dexie (IndexedDB) · Recharts · Lucide · vite-plugin-pwa

## Commands
```bash
npm install
npm run dev        # http://localhost:5173 (food search proxied locally)
npm test           # domain unit tests
npm run typecheck
npm run build
npm run deploy     # build + deploy to Cloudflare Pages (project "myfit")
```

## Structure
```
src/
  app/        shell, router, bottom nav, global logging sheets, theme
  ui/         design system (cards, buttons, sheet, rings, charts, toasts)
  features/   screens: onboarding, today, food, workout, progress, photos, profile
  domain/     pure logic — energy (Mifflin–St Jeor), nutrition, weight trend,
              workouts, habits, weekly insights, rule-based coach
  storage/    Dexie schema, repositories (soft deletes + updatedAt for future sync), backup
  data/       bundled food database (USDA reference values + dish estimates)
  services/   online food search (Open Food Facts) + interfaces for future integrations
functions/    Cloudflare Pages Function: /api/food-search proxy
design-reference/  original "Steady" prototype and the Nocturne design system
```

## Data & privacy
All data (including photos) lives in IndexedDB on the device. Nothing is uploaded.
The only network call is the optional online food search. Export a JSON backup
regularly from Profile → Data & backup.

## Install on iPhone
Open the site in Safari → Share → **Add to Home Screen**.
