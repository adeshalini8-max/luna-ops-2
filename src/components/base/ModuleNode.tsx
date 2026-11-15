import {
  AlertTriangle,
  Battery,
  Droplet,
  Home,
  Shield,
  Sprout,
  Wind,
  Wrench,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import type { ModuleType, OutpostModule } from '../../engine/types';

interface ModuleNodeProps {
  module: OutpostModule;
  day: number;
  selected: boolean;
  onSelect: () => void;
  onRepair?: () => void;
}

/* ─── 3D Physical Visual per module type ─────────────────────────────── */
function ModulePhysicalVisual({
  type,
  offline,
  critical,
}: {
  type: ModuleType;
  offline: boolean;
  critical: boolean;
}) {
  switch (type) {
    /* ── Solar Array ── */
    case 'solar_panel':
      return (
        <div className="relative flex h-24 w-full items-center justify-center">
          {/* Central actuator mast */}
          <div className="absolute bottom-1 h-9 w-4 rounded-sm bg-gradient-to-t from-zinc-700 to-zinc-400 border border-zinc-500 shadow-md flex items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          {/* PV wings */}
          <div className="relative flex w-36 items-center justify-between gap-1 -rotate-3 hover:rotate-0 transition-transform duration-500">
            {[false, true].map((flip) => (
              <div
                key={String(flip)}
                className={`relative h-14 w-16 overflow-hidden rounded-sm border border-cyan-400/50
                  bg-gradient-to-${flip ? 'bl' : 'br'} from-indigo-950 via-slate-900 to-blue-950
                  p-1 shadow-lg`}
              >
                <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-0.5 opacity-80">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-cyan-300/30 bg-blue-500/20" />
                  ))}
                </div>
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-transparent via-cyan-400/10 to-transparent
                    transform ${flip ? 'skew-x-12' : '-skew-x-12'} pointer-events-none`}
                />
              </div>
            ))}
            <div className="absolute h-2 w-4 rounded bg-amber-500 shadow-sm" />
          </div>
        </div>
      );

    /* ── Kilopower Reactor ── */
    case 'reactor':
      return (
        <div className="relative flex h-24 w-full flex-col items-center justify-end pb-1">
          <div className="relative flex h-14 w-16 items-center justify-center">
            {/* Radiator fins */}
            <div className="absolute inset-x-0 h-10 rounded border border-zinc-600 bg-gradient-to-b from-zinc-700 to-zinc-900 shadow-inner flex justify-around px-1 py-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-1 bg-zinc-500/80 rounded" />
              ))}
            </div>
            {/* Fission core */}
            <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-cyan-400/80 bg-zinc-950 shadow-[0_0_16px_rgba(6,182,212,0.85)]">
              <div
                className={`h-4 w-4 rounded-full ${
                  offline
                    ? 'bg-red-500 animate-ping'
                    : 'bg-gradient-to-tr from-cyan-400 to-teal-200 animate-pulse'
                }`}
              />
            </div>
          </div>
          {/* Blast-shield pedestal */}
          <div className="h-5 w-24 rounded-t-sm border border-zinc-600 bg-gradient-to-t from-zinc-900 to-zinc-800 shadow-md flex items-center justify-between px-2">
            <span className="h-1.5 w-3 rounded bg-amber-500/90" />
            <span className="text-[7px] font-black uppercase text-zinc-400 tracking-wider">KILOPOWER</span>
            <span className="h-1.5 w-3 rounded bg-amber-500/90" />
          </div>
        </div>
      );

    /* ── Battery Bank ── */
    case 'battery':
      return (
        <div className="relative flex h-24 w-full items-center justify-center gap-2">
          {[0, 1].map((bank) => (
            <div
              key={bank}
              className="relative w-14 rounded-md border border-zinc-700 bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 p-1.5 shadow-md flex flex-col justify-between"
              style={{ height: '4.5rem' }}
            >
              <div className="flex items-center justify-between">
                <Battery className="h-3 w-3 text-cyan-400" />
                <span className="text-[7px] font-mono text-zinc-400">B-{bank + 1}</span>
              </div>
              <div className="space-y-0.5 py-1">
                <div className="h-1 w-full rounded-sm bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.7)]" />
                <div className="h-1 w-full rounded-sm bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.7)]" />
                <div className="h-1 w-full rounded-sm bg-cyan-500" />
                <div className={`h-1 w-full rounded-sm ${critical ? 'bg-red-500' : 'bg-zinc-700'}`} />
              </div>
              <div className="h-1 rounded bg-zinc-700" />
            </div>
          ))}
          {/* Copper bus-bar */}
          <div className="absolute h-1.5 w-10 rounded bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 shadow-sm" />
        </div>
      );

    /* ── O₂ Generator (MOXIE) ── */
    case 'o2_generator':
      return (
        <div className="relative flex h-24 w-full items-end justify-center pb-1 gap-2">
          <div className="relative flex items-center justify-center">
            {[{ label: 'O₂', right: false }, { label: 'MOXIE', right: true }].map(({ label }) => (
              <div
                key={label}
                className="relative h-14 w-14 rounded-full border-2 border-zinc-400
                  bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-600
                  p-1 shadow-lg flex flex-col items-center justify-center"
              >
                <div className="absolute top-1.5 h-1.5 w-6 rounded-full bg-orange-500/90 text-center font-black text-[6px] text-white">
                  {label}
                </div>
                <div className="h-4 w-4 rounded-full border border-zinc-400 bg-zinc-800/80 flex items-center justify-center">
                  {label === 'O₂'
                    ? <Wind className="h-2.5 w-2.5 text-cyan-300" />
                    : <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  }
                </div>
                <div className="absolute -bottom-1 h-3 w-8 rounded bg-zinc-800 border border-zinc-600" />
              </div>
            ))}
            {/* Cryo manifold */}
            <div className="h-2 w-5 bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] rounded-full -mx-1 z-10" />
          </div>
        </div>
      );

    /* ── Water Recycler ── */
    case 'water_reclaimer':
      return (
        <div className="relative flex h-24 w-full items-end justify-center pb-1 gap-2">
          <div className="relative h-16 w-14 rounded-md border-2 border-blue-400/60
            bg-gradient-to-b from-blue-950/40 via-cyan-950/60 to-blue-900/80
            p-1 shadow-[0_0_15px_rgba(59,130,246,0.3)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[7px] text-cyan-300">
              <span>H₂O</span><Droplet className="h-2.5 w-2.5 text-cyan-400" />
            </div>
            <div className="h-8 w-full rounded bg-gradient-to-t from-blue-600 to-cyan-400/70 shadow-inner opacity-80" />
            <div className="h-1 rounded bg-zinc-700" />
          </div>
          <div className="h-16 w-10 rounded border border-zinc-600 bg-zinc-800 p-1 flex flex-col justify-around">
            {(['#52525b', '#22d3ee', '#52525b', '#60a5fa'] as const).map((hex, i) => (
              <div
                key={i}
                style={{ backgroundColor: hex, boxShadow: i % 2 === 1 ? '0 0 5px rgba(6,182,212,0.8)' : 'none' }}
                className="h-1.5 w-full rounded-sm"
              />
            ))}
          </div>
        </div>
      );

    /* ── Greenhouse ── */
    case 'greenhouse':
      return (
        <div className="relative flex h-24 w-full items-end justify-center pb-1">
          <div
            className="relative h-20 w-24 overflow-hidden rounded-t-full border-2 border-emerald-400/60
              bg-gradient-to-b from-emerald-950/60 via-zinc-950/80 to-zinc-900
              p-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] flex flex-col items-center justify-between"
          >
            <div className="absolute inset-0 border-t border-emerald-300/40 rounded-t-full pointer-events-none" />
            <div className="h-1 w-12 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.9)]" />
            <div className="flex items-center gap-1 text-emerald-400">
              <Sprout className="h-4 w-4 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <Sprout className="h-5 w-5 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <Sprout className="h-4 w-4 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            </div>
            <div className="h-2 w-full rounded bg-zinc-800 border-t border-zinc-700" />
          </div>
        </div>
      );

    /* ── Regolith Shield ── */
    case 'regolith_shield':
      return (
        <div className="relative flex h-24 w-full items-end justify-center pb-1">
          <div
            className="relative h-16 w-28 rounded-t-lg border-2 border-zinc-600
              bg-gradient-to-t from-zinc-900 via-stone-800 to-zinc-700
              p-2 shadow-2xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <Shield className="h-4 w-4 text-stone-300" />
              <span className="text-[7px] font-mono uppercase tracking-widest text-stone-400">ARMOR-65</span>
            </div>
            <div className="grid grid-cols-4 gap-1 py-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-3 rounded-sm border border-stone-500 bg-stone-900" />
              ))}
            </div>
            <div className="h-1.5 w-full rounded bg-amber-600/80" />
          </div>
        </div>
      );

    /* ── Storm Shelter ── */
    case 'storm_shelter':
      return (
        <div className="relative flex h-24 w-full items-end justify-center pb-1">
          <div
            className="relative w-28 rounded-t-xl border-2 border-amber-600/70
              bg-gradient-to-t from-zinc-950 via-zinc-900 to-zinc-800
              p-2 shadow-[0_0_15px_rgba(245,158,11,0.25)] flex flex-col items-center justify-between"
            style={{ height: '4.5rem' }}
          >
            {/* Warning mast */}
            <div className="absolute -top-3 h-4 w-1 bg-zinc-500 flex items-start justify-center">
              <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-ping" />
            </div>
            <div className="flex w-full items-center justify-between text-[7px] font-black text-amber-400 tracking-wider">
              <span>SHELTER</span><Shield className="h-3 w-3" />
            </div>
            {/* Vault door */}
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-zinc-500 bg-zinc-950 shadow-inner">
              <div className="h-4 w-4 rounded-full border border-amber-500 bg-zinc-800 flex items-center justify-center">
                <div className="h-1 w-1 rounded-full bg-amber-400" />
              </div>
            </div>
            <div className="h-1.5 w-full rounded bg-zinc-700" />
          </div>
        </div>
      );

    /* ── Habitat ── */
    case 'habitat':
    default:
      return (
        <div className="relative flex h-24 w-full items-end justify-center pb-1">
          <div
            className="relative w-28 rounded-t-2xl border-2 border-cyan-400/40
              bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-800
              p-2 shadow-xl flex flex-col items-center justify-between"
            style={{ height: '4.5rem' }}
          >
            {/* Cupola */}
            <div className="flex h-5 w-10 items-center justify-center rounded-full border border-zinc-600 bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-[0_0_10px_rgba(251,191,36,0.6)]">
              <Home className="h-3 w-3 text-zinc-950" />
            </div>
            <div className="flex w-full items-center justify-between px-2 text-[7px] font-mono text-zinc-900 font-bold">
              <span>HAB-01</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="h-2 w-full rounded bg-zinc-900 border border-zinc-700" />
          </div>
        </div>
      );
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   MODULE NODE
   Wraps the physical visual in a billboarded, animated card.
   .stand-upright   → counter-rotates exactly -60deg relative to the floor
   .module-drop     → deployed bounce-in animation
   Hover handled by .stand-upright:hover in CSS (spring scale + lift)
═══════════════════════════════════════════════════════════════════════ */
export default function ModuleNode({
  module,
  day,
  selected,
  onSelect,
  onRepair,
}: ModuleNodeProps) {
  const offline = (module.offlineUntilDay ?? 0) > day;
  const oxygen = useGameStore((state) => state.resources.oxygen);
  const power = useGameStore((state) => state.resources.power);
  const activeEvents = useGameStore((state) => state.activeEvents);

  const dustStormActive = activeEvents.some(
    (e) => e.type === 'dust-storm' && (e.active || e.warned),
  );
  const isBaseFailure = oxygen <= 0 || power <= 0;

  return (
    /* Outer non-transformed wrapper keeps the grid layout correct */
    <div className="relative flex flex-col items-center w-full">

      {/* ── Ground-plane anchor shadow ──────────────────────────────────
       * Rendered in the floor plane (before billboarding) so it stays
       * flat on the regolith surface directly beneath the module.
       * -----------------------------------------------------------------*/}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-5 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 45%, transparent 72%)',
          filter: 'blur(4px)',
          borderRadius: '50%',
        }}
      />

      {/* ── Billboarded module card ──────────────────────────────────────
       * .stand-upright  → rotateX(-60deg) from bottom-centre origin
       * .module-drop    → bounce-in keyframe (runs once on mount)
       * -------------------------------------------------------------------*/}
      <article
        className={[
          'stand-upright module-drop',
          'relative w-44 sm:w-48 rounded-xl border p-2.5 shadow-2xl',
          offline
            ? 'border-red-600/90 bg-red-950/80 shadow-[0_0_28px_rgba(239,68,68,0.45)]'
            : selected
              ? 'border-cyan-400 bg-zinc-900/95 ring-2 ring-cyan-400/60 shadow-[0_0_32px_rgba(6,182,212,0.5)]'
              : 'border-zinc-700/80 bg-zinc-950/85 hover:border-cyan-500/70 hover:bg-zinc-900/90',
          isBaseFailure ? 'emergency-strobe' : '',
        ].join(' ')}
      >
        {/* Dust storm badge */}
        {dustStormActive && (
          <div className="absolute -top-2.5 right-2 z-20 flex items-center gap-1 rounded bg-amber-900/90 px-1.5 py-0.5 text-[8px] font-black uppercase text-amber-200 border border-amber-500 shadow-md animate-pulse">
            <AlertTriangle className="h-2.5 w-2.5 text-amber-400" />
            STORM
          </div>
        )}

        {/* Selection corner brackets */}
        {selected && (
          <>
            <span className="absolute -top-1 -left-1 h-2 w-2 border-t-2 border-l-2 border-cyan-400" />
            <span className="absolute -top-1 -right-1 h-2 w-2 border-t-2 border-r-2 border-cyan-400" />
            <span className="absolute -bottom-1 -left-1 h-2 w-2 border-b-2 border-l-2 border-cyan-400" />
            <span className="absolute -bottom-1 -right-1 h-2 w-2 border-b-2 border-r-2 border-cyan-400" />
          </>
        )}

        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={`${module.name}, ${offline ? 'offline' : 'online'}, power priority ${module.powerPriority}`}
          className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1 text-[9px]">
            <span className="font-hud font-bold tracking-wider text-cyan-300">
              PRI {module.powerPriority}
            </span>
            <span className="font-hud text-zinc-500">D{module.deployedDay ?? 0}</span>
          </div>

          {/* Physical Structure */}
          <div className="my-1.5 flex items-center justify-center">
            <ModulePhysicalVisual
              type={module.moduleType}
              offline={offline}
              critical={isBaseFailure}
            />
          </div>

          {/* Footer */}
          <div className="mt-1">
            <p className="truncate text-xs font-black uppercase tracking-wider text-zinc-100">
              {module.name}
            </p>
            <div className="mt-0.5 flex items-center justify-between text-[9px]">
              <span
                className={`font-semibold ${
                  offline ? 'text-red-400 text-glow-red animate-pulse' : 'text-emerald-400'
                }`}
              >
                {offline ? `OFFLINE (D${module.offlineUntilDay})` : 'OPERATIONAL'}
              </span>
              <span className="font-hud text-zinc-500">{module.mass} kg</span>
            </div>
          </div>
        </button>

        {/* Repair CTA */}
        {offline && onRepair && (
          <div className="mt-2 pt-1 border-t border-red-900/50">
            <button
              type="button"
              onClick={onRepair}
              className="inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded border border-red-600 bg-red-950/90 px-2 text-[9px] font-black uppercase tracking-widest text-red-100 hover:bg-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 shadow-lg"
            >
              <Wrench className="h-3 w-3" /> Repair
            </button>
          </div>
        )}
      </article>
    </div>
  );
}
