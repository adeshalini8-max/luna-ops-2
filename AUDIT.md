# Phase 0: Project Audit

## Project snapshot

- React `19.3.1` (the project brief mentions React 18), TypeScript `6.0.3`, Vite `8.3.8`, Zustand `5.1.0`, Tailwind CSS `3.4.19`.
- The existing Tailwind configuration and PostCSS plugin use Tailwind v3 syntax.
- Vitest `5.1.0` and `@playwright/test` `1.65.1` are already installed. The `test` and `e2e` npm scripts are already configured; no test dependencies or scripts needed to be added.
- `npm install` completed with the lockfile up to date. npm reported 7 moderate vulnerabilities across the full dependency tree; `npm audit --omit=dev` reported 0 vulnerabilities in production dependencies. No automatic dependency upgrades were made during this audit.

## What works

- The existing single-screen dashboard renders with resource counters, a comms log, a construction menu, a module grid, and pause/resume controls.
- The Zustand store has six modules, deterministic scheduled dust-storm and solar-particle events, daily resource accounting, resource caps, and a restartable failure/debrief state.
- The TypeScript/Vite production build and ESLint pass.
- The test and browser-test runners are configured and executable. The existing browser smoke test successfully opens the page and checks its title.

## Broken or incomplete

- `src/engine/constants.ts`, `events.ts`, `loop.ts`, and `modules.ts` are empty. Simulation rules currently live inside `src/store/gameStore.ts`, so the engine is not a pure, independently testable simulation.
- The planned component files under `src/components/` are empty; the dashboard, HUD, grid, build menu, and debrief are implemented together in `src/App.tsx`.
- Construction is free and unrestricted. There are no mass or credit budgets, scenario/mode selection, tutorial, 30-day objective, or live survival forecast.
- Failure handling is immediate at zero oxygen or power. Water/food depletion, grace periods, radiation dose limits, morale, and life-support power priority are not modeled.
- Events are fixed day schedules rather than seed-derived scenario data. Lunar night, equipment failures/repairs, event warnings, shelter orders, and causal event chains are absent.
- The debrief presents a text log, not a root-cause chain, save recommendation, reflection, score, or grade. There is no action log or deterministic run replay/share link.
- Testing is only a sanity assertion (`expect(true).toBe(true)`) plus one page-title browser smoke test. There are no engine invariants, determinism, failure, bot, game-flow, or responsive-layout tests.
- `README.md` is still the Vite template. There is no project architecture/science documentation or pitch content.
- `.github/workflows/deploy.yml` is empty, and `vite.config.ts` does not configure the GitHub Pages base path.
- `index.html` points its favicon to `/vite.svg`, but no `public/vite.svg` exists (the Vite SVG is under `src/assets/`); the existing `public/favicon.svg` is not linked.
- The viewport disables browser zoom using `user-scalable=no`. Reduced-motion support, validated WCAG contrast, and a 360px browser check are not present.
- Persistence, NASA DONKI/real-sun mode, Supabase/leaderboards, PWA/offline behavior, an error boundary, lazy screens, demo shortcut, and full production-preview verification are not implemented.

## Phase 0 gate results

Commands were run in `outpost-zero/`:

| Command | Result |
|---|---|
| `npm install` | Passed; dependencies up to date; 7 moderate full-tree advisories reported. |
| `npm run build` | Passed; TypeScript project build and Vite production build completed. |
| `npm run lint` | Passed; ESLint exited successfully. |
| `npm test` | Passed; 1 test file and 1 test passed. |
| `npx playwright install chromium` | Passed; Chromium installation exited successfully. |
| `npm run e2e` | Passed; 1 Chromium smoke test passed. |
| `npm audit --omit=dev` | Passed; 0 production dependency vulnerabilities reported. |

No dependencies were added. The remaining items above are Phase 1–8 scope or known baseline gaps, not changes made during this audit.
