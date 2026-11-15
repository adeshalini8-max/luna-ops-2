
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CircleHelp,
  Layers,
  Plus,
} from 'lucide-react';
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import ModuleNode from './ModuleNode';

export default function Grid() {
  const state = useGameStore();
  const dispatchAction = useGameStore((game) => game.dispatchAction);
  const scenario = useGameStore((game) => game.selectedScenario);

  const [selectedId, setSelectedId] = useState<string>('');

  const selected = state.builtModules.find(
    (module) => module.id === selectedId,
  );

  const isEmergency =
    state.resources.oxygen <= 0 || state.resources.power <= 0;

  const isMars = scenario === 'mars';

  const totalModules = state.builtModules.length;
  const isDesignPhase = state.appPhase === 'design';

  const missionDay = state.daysPassed;
  const dayPhase = missionDay % 6;

  const environmentLight = isEmergency
    ? 'rgba(127,29,29,0.24)'
    : isMars
      ? `rgba(194,65,12,${0.08 + dayPhase * 0.012})`
      : `rgba(148,163,184,${0.06 + dayPhase * 0.008})`;

  function repair(moduleId: string) {
    dispatchAction({
      day: missionDay,
      type: 'repair-module',
      payload: { moduleId },
    });
  }

  function changePriority(
    moduleId: string,
    currentPriority: number,
    direction: -1 | 1,
  ) {
    const nextPriority = Math.max(0, currentPriority + direction);

    if (nextPriority === currentPriority) return;

    dispatchAction({
      day: missionDay,
      type: 'set-power-priority',
      payload: {
        moduleId,
        priority: nextPriority,
      },
    });
  }

  return (
    <div
      className="relative flex h-full min-h-[420px] w-full flex-col items-center justify-end overflow-hidden pb-6"
      data-scenario={scenario}
      data-mission-day={missionDay}
      data-module-count={totalModules}
      data-emergency={isEmergency}
    >
      {/* ==========================================================
          ENVIRONMENT ANIMATIONS
      ========================================================== */}

      <style>{`
        @keyframes outpost-star-twinkle {
          0%, 100% {
            opacity: .15;
            transform: scale(.8);
          }
          50% {
            opacity: .8;
            transform: scale(1.15);
          }
        }

        @keyframes outpost-dust-drift {
          0% {
            transform: translate3d(-5%, 0, 0);
            opacity: .15;
          }
          50% {
            opacity: .55;
          }
          100% {
            transform: translate3d(5%, -12px, 0);
            opacity: .15;
          }
        }

        @keyframes outpost-planet-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-9px);
          }
        }

        @keyframes outpost-deploy-impact {
          0% {
            transform: scale(.25);
            opacity: .85;
          }
          70% {
            transform: scale(1.25);
            opacity: .35;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        @keyframes outpost-pad-pulse {
          0%, 100% {
            box-shadow:
              0 0 12px rgba(6,182,212,.12),
              inset 0 0 12px rgba(6,182,212,.05);
          }
          50% {
            box-shadow:
              0 0 28px rgba(6,182,212,.3),
              inset 0 0 20px rgba(6,182,212,.12);
          }
        }

        @keyframes outpost-beacon {
          0%, 100% { opacity: .35; }
          50% { opacity: 1; }
        }

        @keyframes outpost-environment-shift {
          0%, 100% { opacity: .7; }
          50% { opacity: 1; }
        }

        @keyframes outpost-terrain-scan {
          0% { transform: translateY(-100%); opacity: 0; }
          15% { opacity: .25; }
          85% { opacity: .1; }
          100% { transform: translateY(100%); opacity: 0; }
        }

        .outpost-star {
          animation: outpost-star-twinkle 4s ease-in-out infinite;
        }

        .outpost-motion {
          will-change: transform, opacity;
        }

        .outpost-deployment-ring {
          animation: outpost-deploy-impact .8s ease-out both;
          transform-origin: center;
        }

        .outpost-pad-pulse {
          animation: outpost-pad-pulse 4s ease-in-out infinite;
        }

        .outpost-beacon {
          animation: outpost-beacon 2s ease-in-out infinite;
        }

        /*
         * Deployed structures are rendered in a separate,
         * untransformed overlay. Keep their cards front-facing
         * even if a legacy global .stand-upright rule exists.
         */
        .outpost-module-stage .stand-upright {
          transform: none !important;
          transform-style: flat !important;
        }

        .outpost-module-stage [data-deployed-module],
        .outpost-module-stage [data-deployed-module] > *,
        .outpost-module-stage .module-node-card {
          transform-style: flat;
        }

        .outpost-module-stage .module-node-card {
          transform: none !important;
          backface-visibility: visible;
        }

        @media (max-width: 640px) {
          .outpost-module-stage {
            top: 19%;
            bottom: 9%;
            padding-inline: .75rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .outpost-motion,
          .outpost-motion *,
          .outpost-star,
          .outpost-deployment-ring,
          .outpost-pad-pulse,
          .outpost-beacon {
            animation: none !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      {/* ==========================================================
          1. CINEMATIC ENVIRONMENT
      ========================================================== */}

      {/* Deep-space atmosphere */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 transition-all duration-1000"
        style={{
          background: isMars
            ? 'radial-gradient(ellipse at 50% 75%, #392018 0%, #171013 45%, #050609 100%)'
            : 'radial-gradient(ellipse at 50% 75%, #343b48 0%, #141a24 45%, #03050a 100%)',
        }}
      />

      {/* Environmental illumination */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse at 50% 75%, ${environmentLight}, transparent 70%)`,
        }}
      />

      {/* Existing atmospheric effect */}
      <div
        aria-hidden="true"
        className="solar-flare pointer-events-none absolute inset-0 z-0"
      />

      {/* Distant celestial body */}
      <div
        aria-hidden="true"
        className="outpost-motion pointer-events-none absolute right-[8%] top-[8%] z-[1]"
        style={{
          animation: 'outpost-planet-float 12s ease-in-out infinite',
        }}
      >
        <div
          className="relative h-20 w-20 rounded-full sm:h-28 sm:w-28"
          style={{
            background: isMars
              ? 'radial-gradient(circle at 30% 30%, #e9a477, #a54d32 48%, #451d21 78%, #100b12)'
              : 'radial-gradient(circle at 30% 30%, #e2e8f0, #89939f 48%, #343d4b 78%, #090d15)',
            boxShadow: isMars
              ? 'inset -18px -10px 25px rgba(0,0,0,.8), 0 0 35px rgba(194,65,12,.12)'
              : 'inset -18px -10px 25px rgba(0,0,0,.85), 0 0 35px rgba(148,163,184,.16)',
          }}
        >
          <div
            className="absolute inset-0 rounded-full opacity-40"
            style={{
              background: isMars
                ? 'radial-gradient(circle at 65% 35%, transparent 15%, rgba(60,20,15,.5) 65%)'
                : 'radial-gradient(circle at 65% 35%, transparent 15%, rgba(15,23,42,.5) 65%)',
            }}
          />
        </div>
      </div>

      {/* Stars */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      >
        {Array.from({ length: 65 }, (_, i) => (
          <span
            key={i}
            className="outpost-star absolute rounded-full bg-white"
            style={{
              left: `${(i * 37 + 11) % 100}%`,
              top: `${(i * 53 + 7) % 78}%`,
              width: i % 9 === 0 ? '3px' : '1.5px',
              height: i % 9 === 0 ? '3px' : '1.5px',
              animationDuration: `${3 + (i % 5)}s`,
              animationDelay: `${(i % 7) * 0.4}s`,
              opacity: 0.4,
            }}
          />
        ))}
      </div>

      {/* Environmental dust */}
      <div
        aria-hidden="true"
        className="outpost-motion pointer-events-none absolute inset-x-0 bottom-[12%] z-[2] h-40 overflow-hidden"
        style={{
          background: isMars
            ? 'linear-gradient(0deg, rgba(180,83,9,.16), transparent)'
            : 'linear-gradient(0deg, rgba(148,163,184,.12), transparent)',
          animation:
            'outpost-environment-shift 9s ease-in-out infinite',
        }}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full"
            style={{
              left: `${(i * 31) % 100}%`,
              top: `${(i * 23) % 90}%`,
              background: isMars ? '#d97745' : '#cbd5e1',
              opacity: 0.4,
              animation: `outpost-dust-drift ${5 + (i % 5)}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* ==========================================================
          2. PLANETARY ENVIRONMENT LABEL
      ========================================================== */}

      <div className="pointer-events-none absolute left-5 right-5 top-4 z-10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isEmergency
                  ? 'bg-red-500'
                  : isMars
                    ? 'bg-orange-400'
                    : 'bg-cyan-400'
              }`}
              style={{
                animation: 'outpost-beacon 2s infinite',
              }}
            />

            <span className="font-hud text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300/80">
              {isMars
                ? 'MARS SURFACE OPERATIONS'
                : 'LUNAR SURFACE OPERATIONS'}
            </span>
          </div>

          <p className="mt-1 text-[8px] uppercase tracking-widest text-zinc-500">
            {isMars
              ? 'Elysium Planitia · Iron-rich regolith'
              : 'Shackleton Crater · Lunar regolith'}
          </p>
        </div>

        <div className="text-right">
          <p className="font-hud text-[10px] font-bold text-zinc-300">
            SOL {String(missionDay).padStart(3, '0')}
          </p>

          <p className="text-[8px] uppercase tracking-widest text-zinc-600">
            {isMars ? 'Martian day' : 'Lunar mission day'}
          </p>
        </div>
      </div>

      {/* ==========================================================
          3. PERSPECTIVE TERRAIN
          Decorative only. Deployed modules are not children of this
          transformed plane, so they cannot inherit its perspective.
      ========================================================== */}

      <div className="perspective-container grid-fade-mask pointer-events-none absolute inset-0 z-[3] flex items-center justify-center">
        <div className="perspective-floor relative mt-[20%] flex h-[140%] w-[160%] flex-col shadow-2xl">
          {/* Terrain surface */}
          <div
            className="relative flex-1 overflow-hidden rounded-[100px] border"
            data-scenario={scenario}
            style={{
              borderColor: isMars
                ? 'rgba(194,65,12,.3)'
                : 'rgba(148,163,184,.2)',
              background: isEmergency
                ? 'radial-gradient(ellipse at 50% 100%, #450a0a, #140808 55%, #020204)'
                : isMars
                  ? `radial-gradient(ellipse at 50% 100%, rgba(115,53,32,${0.65 + dayPhase * 0.025}), #211311 55%, #08090d 100%)`
                  : `radial-gradient(ellipse at 50% 100%, rgba(79,89,104,${0.6 + dayPhase * 0.02}), #171d27 55%, #03050a 100%)`,
              boxShadow: 'inset 0 0 180px rgba(0,0,0,.9)',
              transition:
                'background 1.2s ease, border-color 1s ease',
            }}
          >
            {/* Main surveying grid */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(6,182,212,.22) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(6,182,212,.22) 1px, transparent 1px)
                `,
                backgroundSize: '80px 80px',
              }}
            />

            {/* Fine grid */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(6,182,212,.12) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(6,182,212,.12) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
              }}
            />

            {/* Terrain texture */}
            <div
              className="absolute inset-0 opacity-40 mix-blend-overlay"
              style={{
                backgroundImage: `
                  radial-gradient(ellipse at 30% 70%, rgba(255,255,255,.1), transparent 30%),
                  radial-gradient(ellipse at 70% 40%, rgba(255,255,255,.07), transparent 35%),
                  radial-gradient(ellipse at 50% 90%, rgba(255,255,255,.12), transparent 40%)
                `,
              }}
            />

            {/* Surface lighting */}
            <div
              className="absolute inset-0"
              style={{
                background: isMars
                  ? 'linear-gradient(180deg, transparent 35%, rgba(180,83,9,.08))'
                  : 'linear-gradient(180deg, transparent 35%, rgba(148,163,184,.08))',
              }}
            />

            {/* Terrain coordinates */}
            <div className="absolute left-24 right-24 top-12 flex justify-between font-hud text-[9px] tracking-[0.2em] text-cyan-500/40">
              <span>
                <Layers className="mr-2 inline h-3 w-3" />
                {isMars
                  ? 'SECTOR 0-ALPHA'
                  : 'LUNAR SECTOR 0-ALPHA'}
              </span>

              <span className="hidden sm:block">
                {isMars
                  ? 'LAT +4.5° · REGOLITH'
                  : 'LAT -89.9° · REGOLITH'}
              </span>

              <span>UNITS: {totalModules}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================================
          4. UPRIGHT, CENTERED MODULE DEPLOYMENT STAGE

          This is a separate overlay outside the perspective terrain.
          Flex wrapping keeps every row centered, including the final
          row when it contains only one or two modules.
      ========================================================== */}

      <div className="outpost-module-stage pointer-events-none absolute inset-x-0 top-[18%] bottom-[10%] z-[8] flex items-center justify-center px-4 py-3">
        <div
          className="pointer-events-none flex h-full w-full max-w-[1100px] flex-wrap content-center items-end justify-center gap-x-[clamp(12px,2vw,32px)] gap-y-[clamp(20px,3vh,36px)]"
          style={{ alignContent: 'safe center' }}
          aria-label="Deployed outpost modules"
          role="group"
          data-module-layout="centered-flex"
        >
          {/* Deployed modules */}
          {state.builtModules.map((module) => (
            <div
              key={module.id}
              className="pointer-events-auto relative flex w-full max-w-[220px] flex-[0_1_220px] items-end justify-center"
              data-deployed-module={module.id}
            >
              {/* Ground contact shadow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-1/2 h-6 w-[85%] -translate-x-1/2 rounded-full"
                style={{
                  background:
                    'radial-gradient(ellipse, rgba(0,0,0,.95), transparent 75%)',
                  filter: 'blur(7px)',
                }}
              />

              {/* Planet-specific landing illumination */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-1/2 h-14 w-28 -translate-x-1/2 rounded-full"
                style={{
                  background: isMars
                    ? 'radial-gradient(ellipse, rgba(194,65,12,.22), transparent 70%)'
                    : 'radial-gradient(ellipse, rgba(148,163,184,.2), transparent 70%)',
                }}
              />

              {/* Deployment impact ring */}
              <div
                aria-hidden="true"
                className="outpost-deployment-ring pointer-events-none absolute bottom-0 left-1/2 z-0 h-16 w-36 -translate-x-1/2 rounded-full border border-cyan-300/50"
              />

              {/* Actual module */}
              <div className="relative z-10 w-full">
                <ModuleNode
                  module={module}
                  day={missionDay}
                  selected={selectedId === module.id}
                  onSelect={() => {
                    setSelectedId((currentId) =>
                      currentId === module.id ? '' : module.id,
                    );
                  }}
                  onRepair={
                    (module.offlineUntilDay ?? 0) > missionDay
                      ? () => repair(module.id)
                      : undefined
                  }
                />
              </div>
            </div>
          ))}

          {/* Next deployment pad */}
          <div className="pointer-events-auto relative flex w-full max-w-[220px] flex-[0_1_220px] flex-col items-center justify-center">
            {/* Ground illumination */}
            <div
              aria-hidden="true"
              className="absolute bottom-0 h-16 w-48 rounded-full"
              style={{
                background:
                  'radial-gradient(ellipse, rgba(6,182,212,.28), transparent 70%)',
                filter: 'blur(12px)',
              }}
            />

            {/* Deployment platform */}
            <div
              className={`outpost-motion relative flex h-40 w-40 max-w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-cyan-400/50 bg-zinc-950/60 backdrop-blur-sm transition-all duration-500 ${
                isDesignPhase ? 'outpost-pad-pulse' : ''
              }`}
            >
              {/* Internal grid */}
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(6,182,212,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,.25) 1px, transparent 1px)',
                  backgroundSize: '15px 15px',
                }}
              />

              {/* Crosshair */}
              <div className="absolute inset-3 rounded-lg border border-cyan-400/20" />

              <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/20" />

              {/* Pad indicator */}
              <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/60 bg-cyan-950/80 text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,.3)]">
                {isDesignPhase ? (
                  <Plus className="h-6 w-6" />
                ) : (
                  <Layers className="h-5 w-5" />
                )}
              </div>

              <p className="relative z-10 mt-3 text-center font-hud text-[9px] font-black uppercase tracking-widest text-cyan-300">
                {isDesignPhase ? 'Next Deployment' : 'Reserved Pad'}
              </p>

              <p className="relative z-10 mt-1 text-[8px] text-zinc-500">
                PAD-{String(totalModules + 1).padStart(2, '0')}
              </p>

              <div className="outpost-beacon absolute bottom-2 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full bg-cyan-400/50" />
            </div>
          </div>
        </div>

        {/* Empty state */}
        {totalModules === 0 && (
          <div className="pointer-events-none absolute left-1/2 top-[12%] z-20 flex w-max max-w-[90%] -translate-x-1/2 items-center gap-3 rounded-xl border border-amber-700/60 bg-zinc-950/90 px-5 py-4 text-amber-200 shadow-[0_15px_45px_rgba(0,0,0,.6)] backdrop-blur-md">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />

            <div>
              <p className="text-[11px] font-black tracking-wide">
                OUTPOST NOT ESTABLISHED
              </p>

              <p className="mt-1 text-[9px] text-zinc-400">
                Select a blueprint to initiate deployment.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ==========================================================
          5. ENVIRONMENT STATUS
      ========================================================== */}

      <div className="pointer-events-none absolute bottom-3 left-5 z-20 hidden items-center gap-3 rounded-lg border border-zinc-700/50 bg-zinc-950/70 px-3 py-2 backdrop-blur-md sm:flex">
        <span
          className={`h-2 w-2 rounded-full ${
            isEmergency ? 'bg-red-500' : 'bg-emerald-400'
          }`}
        />

        <span className="font-hud text-[8px] uppercase tracking-widest text-zinc-400">
          {isEmergency
            ? 'Environmental emergency'
            : isMars
              ? 'Martian environment stable'
              : 'Lunar environment stable'}
        </span>

        <span className="h-3 w-px bg-zinc-700" />

        <span className="font-hud text-[8px] text-cyan-300">
          {totalModules} MODULES DEPLOYED
        </span>
      </div>

      {/* ==========================================================
          6. SELECTED MODULE CONTROL PANEL
      ========================================================== */}

      {selected && (
        <section
          key={selected.id}
          className="glass-panel fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-xl border border-cyan-500/50 p-5 shadow-[0_20px_60px_rgba(0,0,0,.8)] animate-fade-in-up"
          aria-label={`${selected.name} controls`}
          aria-live="polite"
        >
          {/* Module heading */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded border border-cyan-500/50 bg-cyan-950/80 p-2 text-cyan-300">
                <CircleHelp className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-100">
                  {selected.name}

                  <span className="ml-1 font-hud text-cyan-400">
                    · PRIORITY {selected.powerPriority}
                  </span>
                </h3>

                <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-300">
                  {selected.scientificNote}
                </p>
              </div>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={() => setSelectedId('')}
              aria-label="Close module controls"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-700/50 bg-zinc-900/50 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>

          {/* Controls */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-3">
            {/* Power priority */}
            <div className="flex items-center gap-3 text-[11px]">
              <span className="font-bold uppercase tracking-wider text-zinc-400">
                Power Priority
              </span>

              <button
                type="button"
                aria-label={`Decrease ${selected.name} priority`}
                disabled={selected.powerPriority <= 0}
                onClick={() =>
                  changePriority(
                    selected.id,
                    selected.powerPriority,
                    -1,
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded border border-zinc-700 bg-zinc-900 text-zinc-300 transition-colors hover:border-cyan-500 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <ArrowDown className="h-4 w-4" />
              </button>

              <span className="min-w-6 px-1 text-center font-hud text-base font-bold text-cyan-300 tabular-nums">
                {selected.powerPriority}
              </span>

              <button
                type="button"
                aria-label={`Increase ${selected.name} priority`}
                onClick={() =>
                  changePriority(
                    selected.id,
                    selected.powerPriority,
                    1,
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded border border-zinc-700 bg-zinc-900 text-zinc-300 transition-colors hover:border-cyan-500 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>

            {/* Module telemetry */}
            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 font-hud text-[10px] text-zinc-400">
              <span>
                MASS:{' '}
                <strong className="text-xs text-zinc-100">
                  {selected.mass} kg
                </strong>
              </span>

              <span className="text-zinc-600">|</span>

              <span>
                PWR:{' '}
                <strong className="text-xs text-amber-400">
                  {selected.powerConsumed} kW
                </strong>
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
