
import {
  Activity,
  AlertTriangle,
  Battery,
  Cpu,
  Droplet,
  Home,
  Moon,
  Shield,
  Sprout,
  Sun,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';

import { useGameStore } from '../../store/gameStore';
import type { ModuleType, OutpostModule } from '../../engine/types';

interface ModuleNodeProps {
  module: OutpostModule;
  day: number;
  selected: boolean;
  onSelect: () => void;
  onRepair?: () => void;
}

type Scenario = 'mars' | 'moon';

interface ModuleImageConfig {
  src: string;
  alt: string;
  fallback: LucideIcon;
  label: string;
}

interface PhysicalVisualProps {
  type: ModuleType;
  offline: boolean;
  critical: boolean;
  scenario: Scenario;
}

const moduleIcons: Record<ModuleType, LucideIcon> = {
  solar_panel: Sun,
  reactor: Zap,
  battery: Battery,
  o2_generator: Wind,
  water_reclaimer: Droplet,
  greenhouse: Sprout,
  regolith_shield: Shield,
  storm_shelter: Shield,
  habitat: Home,
};

/**
 * Individual image assets for each deployable module.
 *
 * These use publicly accessible Unsplash CDN images.
 * No API key or runtime API request is required.
 *
 * For production deployments, download the selected images
 * into /public/images/modules and update these paths to local assets.
 */
const moduleImages: Record<ModuleType, ModuleImageConfig> = {
  solar_panel: {
    src: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=900&q=85',
    alt: 'Solar panel array',
    fallback: Sun,
    label: 'SOLAR ARRAY',
  },
  reactor: {
    src: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=900&q=85',
    alt: 'Industrial power generation equipment',
    fallback: Zap,
    label: 'KILOPOWER REACTOR',
  },
  battery: {
    src: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=900&q=85',
    alt: 'Energy storage battery equipment',
    fallback: Battery,
    label: 'BATTERY BANK',
  },
  o2_generator: {
    src: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=900&q=85',
    alt: 'Industrial oxygen generation equipment',
    fallback: Wind,
    label: 'OXYGEN GENERATOR',
  },
  water_reclaimer: {
    src: 'https://images.unsplash.com/photo-1530053969600-caed2596d242?auto=format&fit=crop&w=900&q=85',
    alt: 'Water purification and filtration equipment',
    fallback: Droplet,
    label: 'WATER RECLAIMER',
  },
  greenhouse: {
    src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=85',
    alt: 'Greenhouse plants and growing environment',
    fallback: Sprout,
    label: 'GREENHOUSE',
  },
  regolith_shield: {
    src: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=85',
    alt: 'Rocky planetary surface terrain',
    fallback: Shield,
    label: 'REGOLITH SHIELD',
  },
  storm_shelter: {
    src: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=85',
    alt: 'Heavy-duty architectural shelter structure',
    fallback: Shield,
    label: 'STORM SHELTER',
  },
  habitat: {
    src: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=85',
    alt: 'Earth viewed from space',
    fallback: Home,
    label: 'CREW HABITAT',
  },
};

const environmentStyles = {
  mars: {
    glow: 'rgba(251,146,60,0.18)',
    accent: '#fb923c',
    surface: 'MARS SURFACE',
    border: 'border-orange-700/50',
  },
  moon: {
    glow: 'rgba(148,197,255,0.16)',
    accent: '#7dd3fc',
    surface: 'LUNAR SURFACE',
    border: 'border-slate-500/60',
  },
} satisfies Record<
  Scenario,
  {
    glow: string;
    accent: string;
    surface: string;
    border: string;
  }
>;

function ModulePhysicalVisual({
  type,
  offline,
  critical,
  scenario,
}: PhysicalVisualProps) {
  const config = moduleImages[type];
  const environment = environmentStyles[scenario];
  const [imageFailed, setImageFailed] = useState(false);

  const Icon = config.fallback;

  return (
    <div
      className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-lg"
      data-module-visual={type}
      data-image-fallback={imageFailed}
      aria-label={config.alt}
    >
      {/* Environment lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 20%, ${environment.glow}, transparent 72%)`,
        }}
      />

      {/* Ground shadow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 left-1/2 h-5 w-32 -translate-x-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(ellipse, rgba(0,0,0,0.9), transparent 72%)',
          filter: 'blur(5px)',
        }}
      />

      {/* Individual module image */}
      {!imageFailed ? (
        <img
          src={config.src}
          alt={config.alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className={[
            'relative z-10 h-full w-full rounded-lg object-cover',
            'object-center transition-[filter] duration-300',
            offline ? 'grayscale opacity-50' : 'opacity-95',
          ].join(' ')}
        />
      ) : (
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-3 rounded-lg border border-zinc-700/70 bg-gradient-to-br from-zinc-800 via-zinc-950 to-black">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-950/40"
            style={{
              boxShadow: `0 0 30px ${environment.glow}`,
            }}
          >
            <Icon
              className={`h-9 w-9 ${
                offline ? 'text-red-400' : 'text-cyan-300'
              }`}
              strokeWidth={1.5}
            />
          </div>

          <span className="text-[9px] font-black tracking-[0.2em] text-zinc-400">
            {config.label}
          </span>

          <span className="text-[8px] tracking-wider text-zinc-600">
            VISUAL ASSET UNAVAILABLE
          </span>
        </div>
      )}

      {/* Image contrast overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-lg"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, transparent 45%, rgba(0,0,0,0.65) 100%)',
        }}
      />

      {/* Module identification */}
      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 rounded border border-white/10 bg-black/65 px-2 py-1 backdrop-blur-sm">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            offline
              ? 'bg-red-500 shadow-[0_0_8px_#ef4444]'
              : critical
                ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
          }`}
        />
        <span className="text-[8px] font-bold tracking-widest text-white/90">
          {offline ? 'OFFLINE' : critical ? 'SYSTEM ALERT' : 'ONLINE'}
        </span>
      </div>

      {/* Environment indicator */}
      <div className="absolute right-2 top-2 z-20 rounded border border-white/10 bg-black/60 px-1.5 py-1 text-[7px] font-bold tracking-widest text-white/80 backdrop-blur-sm">
        {scenario === 'mars' ? 'MARS' : 'LUNAR'}
      </div>

      {/* Offline overlay */}
      {offline && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-red-950/15">
          <div className="rounded border border-red-500/50 bg-red-950/90 px-3 py-1.5 text-[9px] font-black tracking-[0.2em] text-red-200">
            MODULE OFFLINE
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleStatus({
  offline,
  critical,
  offlineUntilDay,
}: {
  offline: boolean;
  critical: boolean;
  offlineUntilDay?: number;
}) {
  if (offline) {
    return (
      <span className="flex items-center gap-1.5 font-semibold tracking-wide text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_7px_#ef4444]" />
        OFFLINE · D{offlineUntilDay ?? 0}
      </span>
    );
  }

  if (critical) {
    return (
      <span className="flex items-center gap-1.5 font-semibold tracking-wide text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_7px_#fbbf24]" />
        SYSTEM ALERT
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 font-semibold tracking-wide text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_7px_#34d399]" />
      OPERATIONAL
    </span>
  );
}

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
  const scenario = useGameStore((state) => state.selectedScenario);

  const dustStormActive = activeEvents.some(
    (event) =>
      event.type === 'dust-storm' && (event.active || event.warned),
  );

  const lunarNightActive = activeEvents.some(
    (event) =>
      event.type === 'lunar-night' && (event.active || event.warned),
  );

  const isBaseFailure = oxygen <= 0 || power <= 0;
  const isMars = scenario === 'mars';

  const Icon = moduleIcons[module.moduleType];
  const imageConfig = moduleImages[module.moduleType];

  const environmentAccent = offline
    ? 'border-red-600/70'
    : environmentStyles[scenario].border;

  const cardStyle: CSSProperties = {
    boxShadow: offline
      ? '0 18px 25px -8px rgba(0,0,0,.95), 0 0 22px rgba(239,68,68,.18), inset 0 2px 2px rgba(255,255,255,.13)'
      : selected
        ? '0 18px 25px -8px rgba(0,0,0,.95), 0 0 25px rgba(6,182,212,.3), inset 0 2px 2px rgba(255,255,255,.2)'
        : '0 18px 25px -8px rgba(0,0,0,.95), 0 8px 12px rgba(0,0,0,.55), inset 0 2px 2px rgba(255,255,255,.17)',
  };

  return (
    <div
      className="group relative flex w-full flex-col items-center"
      data-module-node={module.id}
    >
      <style>{`
        @keyframes module-node-drop {
          0% {
            opacity: 0;
            transform: translateY(-24px);
          }
          70% {
            opacity: 1;
            transform: translateY(3px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes module-node-impact {
          0% {
            opacity: .75;
            transform: translateX(-50%) scale(.35);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) scale(1.5);
          }
        }

        @keyframes module-node-beacon {
          0%, 100% {
            opacity: .45;
          }
          50% {
            opacity: 1;
          }
        }

        .module-node-enter {
          animation: module-node-drop .55s cubic-bezier(.2,.75,.25,1) both;
        }

        .module-node-impact-ring {
          animation: module-node-impact .8s ease-out both;
        }

        .module-node-beacon {
          animation: module-node-beacon 2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .module-node-enter,
          .module-node-impact-ring,
          .module-node-beacon {
            animation: none !important;
          }

          .module-node-card,
          .module-node-card * {
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Ground contact shadow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full transition-transform duration-300 group-hover:scale-110"
        style={{
          width: '180px',
          height: '30px',
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,.95) 0%, rgba(0,0,0,.55) 45%, transparent 75%)',
          filter: 'blur(7px)',
        }}
      />

      {/* Environmental ground illumination */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 h-16 w-40 -translate-x-1/2 rounded-full blur-xl"
        style={{
          background: offline
            ? 'rgba(239,68,68,.13)'
            : environmentStyles[scenario].glow,
        }}
      />

      {/* Module card */}
      <article
        className={[
          'module-node-enter module-node-card relative w-44 sm:w-48',
          'overflow-visible rounded-xl border p-2.5',
          'transition-[border-color,box-shadow,filter] duration-300 ease-out',
          'hover:-translate-y-1 hover:brightness-110',
          environmentAccent,
          offline
            ? 'bg-gradient-to-br from-red-950 via-zinc-950 to-black'
            : selected
              ? 'border-cyan-400 bg-gradient-to-br from-zinc-800 via-zinc-950 to-black ring-2 ring-cyan-400/50'
              : 'bg-gradient-to-br from-zinc-800 via-zinc-950 to-black hover:border-cyan-500/70',
          isBaseFailure && !offline ? 'emergency-strobe' : '',
        ].join(' ')}
        data-scenario={scenario}
        data-module-type={module.moduleType}
        data-module-id={module.id}
        data-offline={offline}
        data-selected={selected}
        style={cardStyle}
      >
        {/* Deployment impact effect */}
        <div
          aria-hidden="true"
          className="module-node-impact-ring pointer-events-none absolute -bottom-1 left-1/2 z-0 h-16 w-36 rounded-full border border-cyan-300/50"
        />

        {/* Metallic reflection */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            background:
              'linear-gradient(125deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,.02) 20%, transparent 48%, rgba(0,0,0,.3) 100%)',
          }}
        />

        {/* Planetary event indicators */}
        {isMars && dustStormActive && (
          <div className="absolute -top-2.5 right-2 z-30 flex items-center gap-1 rounded border border-amber-500 bg-amber-950 px-1.5 py-0.5 text-[8px] font-black uppercase text-amber-200 shadow-lg">
            <AlertTriangle className="h-2.5 w-2.5 text-amber-400" />
            DUST STORM
          </div>
        )}

        {scenario === 'moon' && lunarNightActive && (
          <div className="absolute -top-2.5 right-2 z-30 flex items-center gap-1 rounded border border-sky-400/80 bg-slate-950 px-1.5 py-0.5 text-[8px] font-black uppercase text-sky-200 shadow-lg">
            <Moon className="h-2.5 w-2.5 text-sky-300" />
            LUNAR NIGHT
          </div>
        )}

        {/* Critical systems warning */}
        {isBaseFailure && !offline && (
          <div className="absolute -top-2.5 left-2 z-30 flex items-center gap-1 rounded border border-red-600/70 bg-red-950 px-1.5 py-0.5 text-[8px] font-black uppercase text-red-200">
            <AlertTriangle className="h-2.5 w-2.5" />
            CRITICAL
          </div>
        )}

        {/* Selection corners */}
        {selected && (
          <>
            <span className="absolute -left-1 -top-1 z-30 h-3 w-3 border-l-2 border-t-2 border-cyan-400" />
            <span className="absolute -right-1 -top-1 z-30 h-3 w-3 border-r-2 border-t-2 border-cyan-400" />
            <span className="absolute -bottom-1 -left-1 z-30 h-3 w-3 border-b-2 border-l-2 border-cyan-400" />
            <span className="absolute -bottom-1 -right-1 z-30 h-3 w-3 border-b-2 border-r-2 border-cyan-400" />
          </>
        )}

        {/* Main module selection */}
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={`${module.name}, ${offline ? 'offline' : 'online'}, power priority ${module.powerPriority}`}
          className="relative z-10 block w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          {/* Module header */}
          <div className="flex items-center justify-between border-b border-zinc-700/80 pb-1.5 text-[9px]">
            <span className="flex items-center gap-1.5 font-hud font-bold tracking-wider text-cyan-300">
              <Cpu className="h-3 w-3" />
              PRI {module.powerPriority}
            </span>

            <span className="font-hud text-zinc-400">
              DEPLOYED D{module.deployedDay ?? 0}
            </span>
          </div>

          {/* Individual module image */}
          <div
            className="relative my-2 overflow-hidden rounded-lg border border-zinc-700/70 bg-zinc-950"
            style={{
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,.7)',
            }}
          >
            <ModulePhysicalVisual
              type={module.moduleType}
              offline={offline}
              critical={isBaseFailure}
              scenario={scenario}
            />
          </div>

          {/* Module identity */}
          <div className="relative border-t border-zinc-700/70 pt-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-zinc-700 bg-zinc-900/80">
                <Icon className="h-4 w-4 text-cyan-400" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black uppercase tracking-wider text-zinc-100">
                  {module.name}
                </p>
                <p className="mt-0.5 truncate text-[8px] font-hud tracking-wider text-zinc-500">
                  {imageConfig.label}
                </p>
              </div>
            </div>

            {/* Module status and mass */}
            <div className="mt-2 flex items-center justify-between gap-2 text-[9px]">
              <ModuleStatus
                offline={offline}
                critical={isBaseFailure}
                offlineUntilDay={module.offlineUntilDay}
              />

              <span className="shrink-0 font-hud tabular-nums text-zinc-400">
                {module.mass} kg
              </span>
            </div>
          </div>
        </button>

        {/* Repair action */}
        {offline && onRepair && (
          <div className="relative z-20 mt-2 border-t border-red-900/60 pt-2">
            <button
              type="button"
              onClick={onRepair}
              className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded border border-red-600 bg-gradient-to-b from-red-900 to-red-950 px-2 text-[9px] font-black uppercase tracking-widest text-red-100 shadow-[0_4px_8px_rgba(0,0,0,.7)] transition-colors duration-200 hover:border-red-400 hover:from-red-700 hover:to-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <Wrench className="h-3 w-3" />
              Repair Module
            </button>
          </div>
        )}

        {/* Operational telemetry */}
        <div className="mt-2 flex items-center justify-between border-t border-zinc-800/70 pt-1.5 text-[8px] font-hud uppercase tracking-wider text-zinc-600">
          <span>{environmentStyles[scenario].surface}</span>

          <span className="flex items-center gap-1">
            <Activity className="h-2.5 w-2.5" />
            {offline ? 'SYSTEM DOWN' : 'LINK ACTIVE'}
          </span>
        </div>
      </article>
    </div>
  );
}
