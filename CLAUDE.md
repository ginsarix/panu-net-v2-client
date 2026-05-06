# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Type-check + production build (run-p)
npm run type-check   # vue-tsc --build only
npm run lint         # ESLint with auto-fix
npm run format       # Prettier over src/
```

## Stack

Vue 3 + TypeScript admin panel using:
- **Vuetify 3** — all UI components; use `v-*` components from the library
- **Pinia** — composition-style stores (`defineStore` with `setup()`)
- **Vue Router 4** — hash-mode (`createWebHashHistory`)
- **tRPC 11** — type-safe API calls; never use raw axios for backend data
- **date-fns** with Turkish locale (`tr`) for all date formatting

## Architecture

### Routing & Access Control

`src/router/index.ts` defines all routes with a `meta.roles` array. The `beforeEach` guard:
1. Redirects unauthenticated users to `/login`
2. Loads page roles from `usePageRolesStore` on first navigation
3. Blocks routes where the user lacks the required role

Admin users bypass page-role checks; non-admins are checked against `usePageRolesStore`.

### State Management

Key stores and their responsibilities:
- `useCurrentUserStore` — authentication state, triggers role loading on login
- `useCompaniesStore` — selected company + active period; also manages the tRPC SSE subscription for credit counts
- `useDefinitionsStore` — app-wide metadata (loaded lazily, used across many views)
- `usePageRolesStore` — per-page permission flags for the current user
- `useSnackbarStore` — global notification queue
- `useDisplayStore` — reactive mobile/theme state (reads `localStorage` for theme)

### API Layer

`src/services/trpc.ts` creates the tRPC client with:
- **Batch link** for regular queries/mutations
- **SSE link** for subscriptions
- `credentials: 'include'` — cookie-based auth
- A custom `FormDataTransformer` so file uploads serialize correctly alongside SuperJSON

All API calls live in `src/services/api/` as thin wrappers around `trpc.*`. Import from there rather than calling `trpc` directly in components.

### Component Conventions

- Custom shared components are prefixed `Gix` (e.g., `GixDataTable`, `GixTextField`)
- All components use `<script setup lang="ts">` (Composition API)
- Data tables use server-side options (`v-model:options`, emit `update:options` for pagination/sorting)
- Excel export uses `@e965/xlsx` via a utility in `src/utils/`
- Charts use `vue-chartjs` wrappers; chart data builders live in `src/utils/chart.ts`

### Formatting & Locale

- `src/utils/formatting.ts` exports `formatToLocale` (currency) and `formatDateTime` — use these everywhere, never inline `Intl` or `date-fns` calls in components
- `formatDateTime` returns `''` on invalid input (safe to render directly)
- Turkish is the UI language; variable names and comments are in english

### Theming

Vuetify theme is configured in `src/plugins/vuetify.ts` with `light` and `dark` variants. The active theme is stored in `localStorage` and applied in `useDisplayStore`. Chart colors must be reactive to theme changes — see existing chart components for the pattern.

### Path Alias

`@` maps to `src/`. Always use `@/` for imports within `src/`.
