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
  const [selectedId, setSelectedId] = useState('');

  const selected = state.builtModules.find((module) => module.id === selectedId);

  function repair(moduleId: string) {
    dispatchAction({
      day: state.daysPassed,
      type: 'repair-module',
      payload: { moduleId },
    });
  }

  const totalSlots = state.builtModules.length + 1;
  const columns = Math.max(2, Math.min(4, Math.ceil(Math.sqrt(totalSlots))));

  return (
    <div className="relative flex flex-col items-center justify-end w-full h-full pb-6">

      {/*
       * ── PERSPECTIVE CONTAINER ──────────────────────────────────────────
       * perspective-floor sets the CSS frustum (1200px, vanishing point top-centre).
       * We widen it past 100vw so the grid bleeds to the left/right screen edges,
       * selling the illusion of a vast surface stretching horizon to viewer.
       * ─────────────────────────────────────────────────────────────────── */}
      <div
        className="perspective-floor w-[160%] -ml-[30%] relative"
        style={{ height: 'clamp(420px, 65vh, 760px)' }}
      >
        {/*
         * ── TILTED FLOOR PLANE ─────────────────────────────────────────────
         * grid-fade-mask fades the distant (top) edge into the starry bg.
         * The perspective-floor-inner class applies rotateX(60deg).
         * ─────────────────────────────────────────────────────────────────── */}
        <div className="perspective-floor-inner grid-fade-mask absolute inset-0 flex flex-col">

          {/* Regolith Surface Plate */}
          <div
            className="relative flex-1 rounded-t-3xl overflow-hidden"
            style={{
              background:
                'radial-gradient(ellipse 120% 70% at 50% 110%, rgba(30,27,20,1) 0%, rgba(14,13,10,0.95) 55%, rgba(5,5,8,0.9) 100%)',
            }}
          >
            {/* Laser Survey Grid Lines */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(6, 182, 212, 0.18) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(6, 182, 212, 0.18) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px',
              }}
            />

            {/* Secondary fine grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(6, 182, 212, 0.08) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(6, 182, 212, 0.08) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
              }}
            />

            {/* Regolith Dust Texture – subtle radial spots */}
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 80%, rgba(80,70,50,0.4) 0%, transparent 25%), ' +
                  'radial-gradient(circle at 75% 65%, rgba(60,55,40,0.3) 0%, transparent 20%), ' +
                  'radial-gradient(circle at 50% 90%, rgba(40,38,28,0.5) 0%, transparent 35%)',
              }}
            />

            {/* Telemetry Header Stamp */}
            <div className="absolute top-4 left-6 right-6 flex items-center justify-between text-[9px] font-hud tracking-widest text-cyan-400/70 pointer-events-none select-none">
              <span className="flex items-center gap-1.5">
                <Layers className="h-3 w-3" />
                SECTOR 0-ALPHA · SHACKLETON CRATER RIM
              </span>
              <span className="hidden sm:block">LAT –89.9° · REGOLITH CLASS IV</span>
              <span>MODULES: {state.builtModules.length}</span>
            </div>

            {/*
             * ── MODULE GRID ───────────────────────────────────────────────
             * Items are inside the tilted plane; each ModuleNode applies
             * .stand-upright (rotateX -60deg) to billboard straight up.
             * ─────────────────────────────────────────────────────────────*/}
            <div
              className="absolute bottom-0 left-0 right-0 grid items-end justify-items-center pb-4 px-6 gap-x-6 gap-y-0"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(160px, 220px))` }}
            >
              {state.builtModules.map((module) => (
                <ModuleNode
                  key={module.id}
                  module={module}
                  day={state.daysPassed}
                  selected={selectedId === module.id}
                  onSelect={() =>
                    setSelectedId((id) => (id === module.id ? '' : module.id))
                  }
                  onRepair={
                    (module.offlineUntilDay ?? 0) > state.daysPassed
                      ? () => repair(module.id)
                      : undefined
                  }
                />
              ))}

              {/* ── DEPLOYMENT ZONE ──────────────────────────────────────── */}
              <div className="relative flex flex-col items-center group">

                {/* Ground anchor glow that sits on the floor plane */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-6 rounded-full pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(ellipse at center, rgba(6,182,212,0.4) 0%, transparent 72%)',
                    filter: 'blur(6px)',
                  }}
                />

                <div
                  className="stand-upright animate-deploy-pulse relative flex flex-col items-center justify-center
                    w-44 h-48 rounded-2xl border-2 border-dashed border-cyan-400/55
                    bg-cyan-950/15 backdrop-blur-[2px] cursor-default select-none"
                >
                  {/* Inner spinning ring */}
                  <div
                    className="absolute inset-4 rounded-xl border border-cyan-400/25 pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(ellipse at center, rgba(6,182,212,0.07) 0%, transparent 70%)',
                    }}
                  />

                  {/* Plus Icon */}
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-900/50 text-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.5)]">
                    <Plus className="h-5 w-5" />
                  </div>

                  <p className="mt-3 text-center font-hud text-[10px] font-bold uppercase tracking-wider text-cyan-300 text-glow-cyan">
                    Deployment Zone
                  </p>
                  <p className="mt-0.5 text-center text-[8px] text-zinc-400 px-3">
                    {state.appPhase === 'design'
                      ? 'Open — select a blueprint'
                      : 'Reserved pad'}
                  </p>
                  <div className="mt-2 rounded bg-zinc-900/80 px-2 py-0.5 font-hud text-[7px] text-zinc-500 uppercase tracking-widest border border-zinc-800">
                    PAD-{String(state.builtModules.length + 1).padStart(2, '0')}
                  </div>
                </div>
              </div>
            </div>

            {/* Zero-module warning strip */}
            {state.builtModules.length === 0 && (
              <div className="absolute left-6 right-6 bottom-56 flex items-center justify-center gap-2 rounded-lg border border-amber-900/60 bg-amber-950/50 p-3 text-xs text-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-400 flex-none" />
                <span>
                  No modules deployed — select blueprints from the Build Menu to establish
                  life support and power.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SELECTED MODULE DETAIL PANEL ──────────────────────────────────── */}
      {selected && (
        <section
          className="glass-panel fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl rounded-xl border border-cyan-500/50 p-4 shadow-2xl animate-fade-in-up"
          aria-label={`${selected.name} controls`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="rounded border border-cyan-500/40 bg-cyan-950/60 p-1.5 text-cyan-300">
                <CircleHelp className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-100">
                  {selected.name}{' '}
                  <span className="text-cyan-400 font-hud">· PRIORITY {selected.powerPriority}</span>
                </h3>
                <p className="mt-1 text-[10px] leading-relaxed text-zinc-300">
                  {selected.scientificNote}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId('')}
              aria-label="Close module controls"
              className="min-h-8 min-w-8 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-zinc-800/80 pt-2.5">
            <div className="flex items-center gap-2 text-[10px]">
              <span className="font-bold uppercase tracking-wider text-zinc-400">
                Power Priority
              </span>
              <button
                type="button"
                aria-label={`Decrease ${selected.name} priority`}
                disabled={selected.powerPriority === 0}
                onClick={() =>
                  dispatchAction({
                    day: state.daysPassed,
                    type: 'set-power-priority',
                    payload: {
                      moduleId: selected.id,
                      priority: Math.max(0, selected.powerPriority - 1),
                    },
                  })
                }
                className="flex h-7 w-7 items-center justify-center rounded border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-cyan-500 hover:text-cyan-300 disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <span className="font-hud text-sm font-bold text-cyan-300 px-1">
                {selected.powerPriority}
              </span>
              <button
                type="button"
                aria-label={`Increase ${selected.name} priority`}
                onClick={() =>
                  dispatchAction({
                    day: state.daysPassed,
                    type: 'set-power-priority',
                    payload: {
                      moduleId: selected.id,
                      priority: selected.powerPriority + 1,
                    },
                  })
                }
                className="flex h-7 w-7 items-center justify-center rounded border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-cyan-500 hover:text-cyan-300"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 font-hud text-[9px] text-zinc-400">
              <span>
                MASS: <strong className="text-zinc-200">{selected.mass} kg</strong>
              </span>
              <span>·</span>
              <span>
                PWR:{' '}
                <strong className="text-amber-300">{selected.powerConsumed} kW</strong>
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
