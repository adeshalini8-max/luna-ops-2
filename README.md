# Outpost Zero

Outpost Zero is a deterministic resource-management game about designing and operating a crewed lunar or Martian outpost. Players trade mass, credits, power, life support, food, and radiation protection to keep a four-person crew alive for 30 mission days.

## Run locally

```powershell
npm install
npm run dev
```

Open the displayed local URL. Use `?demo=1` to launch a seeded, automatically advancing failure mission and inspect its cause-chain debrief.

## Play

1. Choose Mars or the Moon, Cadet or Engineer mode, and whether to include the interactive briefing.
2. Deploy modules within the mass and credit budgets. The design screen runs a deterministic survival forecast.
3. Begin operations. Monitor resources and event warnings, pause or change simulation speed, manage rations, set module power priorities, shelter the crew, and repair failed systems.
4. Review the mission outcome and causal timeline. A replay link records the seed, mode, scenario, optional historical-event input, and accepted actions.

Every mission seed and action sequence produces the same simulation result. Weather and equipment events are scheduled before the mission begins. Resource values, module costs, throughput, radiation dose, and event magnitudes are game-scaled teaching values—not vehicle specifications or operational recommendations.

## NASA DONKI data

Real Sun Mode uses historical Solar Energetic Particle (SEP) records from the public [NASA DONKI SEP API](https://api.nasa.gov/DONKI/SEP). The app requests the most recent 30-day window with a four-second timeout, validates response fields and NASA links, and falls back without blocking play if the service is unavailable or returns invalid data.

The bundled archive contains 13 SEP records from January 2024, each linked to its NASA DONKI record. DONKI SEP records identify particle events rather than providing a single event-severity class; the interface labels these records `SEP` rather than inferring a flare class. For each mission, the selected record list and seed produce a repeatable training schedule, and replay links carry the exact input records.

## Local data and privacy

Only player preferences (scenario, mode, Real Sun Mode, sound, and briefing choice) and the best local run are stored in browser `localStorage`. Mission state is not persisted or sent to a game backend. NASA DONKI requests go directly from the browser to NASA's public API.

## Development checks

```powershell
npm run build
npm run lint
npm test
npm run e2e
```

`npm run build` creates the production site in `dist`. To exercise that build locally:

```powershell
npm run preview
```

## Architecture

- `src/engine/` contains the pure deterministic simulation, seeded event schedule, validation, and replay encoding.
- `src/store/gameStore.ts` adapts the engine and mission flow to Zustand.
- `src/components/` contains the resource HUD, grid, module controls, resource-flow diagram, advisors, and time controls.
- `src/services/nasaDonki.ts` validates and loads NASA DONKI SEP records; `src/data/sunEvents.ts` is the offline archive.
- `src/storage/localData.ts` limits browser persistence to preferences and best-run data.
- `e2e/` contains Playwright browser flows; `src/engine/` and `src/services/` contain deterministic unit tests.

## Hackathon pitch (about 30 seconds)

> Outpost Zero turns lunar and Mars base planning into a hands-on systems challenge. Build a crewed outpost within a real trade-off budget, then operate it through deterministic resource pressure, equipment faults, dust storms, lunar nights, and historical solar-particle events from NASA's DONKI archive. When a mission fails, the debrief traces the chain of causes so players can learn what to redesign—not just see a game-over screen. The simulation's numbers are explicitly educational, not flight-design guidance.
