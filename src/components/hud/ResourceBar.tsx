import { Activity, AlertTriangle, Box, Droplet, Radio, Shield, Wind, Zap } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import type { ResourceKey } from '../../engine/types';

interface ResourceConfig {
  key: ResourceKey;
  label: string;
  name: string;
  icon: typeof Wind;
  accentColor: string;
}

const resourceConfigs: ResourceConfig[] = [
  { key: 'oxygen', label: 'O₂', name: 'Oxygen', icon: Wind, accentColor: 'from-cyan-500 to-sky-400' },
  { key: 'power', label: 'PWR', name: 'Power', icon: Zap, accentColor: 'from-amber-400 to-yellow-300' },
  { key: 'water', label: 'H₂O', name: 'Water', icon: Droplet, accentColor: 'from-blue-500 to-cyan-400' },
  { key: 'food', label: 'FOOD', name: 'Food', icon: Box, accentColor: 'from-emerald-500 to-teal-400' },
  { key: 'radiationDose', label: 'RAD', name: 'Radiation dose', icon: Shield, accentColor: 'from-purple-500 to-violet-400' },
];

function percentage(value: number, capacity: number): number {
  if (capacity <= 0) return 0;
  return Math.max(0, Math.min(100, (value / capacity) * 100));
}

function ResourceGauge({ config }: { config: ResourceConfig }) {
  const value = useGameStore((state) => state.resources[config.key]);
  const capacity = useGameStore((state) => state.resourceCaps[config.key]);
  const mode = useGameStore((state) => state.mode);
  const percent = percentage(value, capacity);
  const isRadiation = config.key === 'radiationDose';

  // Status calculation: 0 = critical red pulse, < 20 = warning amber, else nominal
  const isZeroCritical = isRadiation ? percent >= 95 : value <= 0;
  const isWarningAmber = isRadiation ? percent >= 65 && !isZeroCritical : value > 0 && value < 20;

  let textStyle = 'text-cyan-200 text-glow-cyan';
  let barGradient = config.accentColor;
  let statusBadge = null;

  if (isZeroCritical) {
    textStyle = 'text-red-400 text-glow-red animate-pulse';
    barGradient = 'from-red-600 to-red-400';
    statusBadge = (
      <span className="rounded bg-red-950/80 px-1 py-0.5 text-[8px] font-black uppercase tracking-wider text-red-300 border border-red-700/50">
        DEPLETED
      </span>
    );
  } else if (isWarningAmber) {
    textStyle = 'text-amber-300 text-glow-amber';
    barGradient = 'from-amber-500 to-orange-400';
    statusBadge = (
      <span className="rounded bg-amber-950/80 px-1 py-0.5 text-[8px] font-black uppercase tracking-wider text-amber-300 border border-amber-700/50">
        WARN
      </span>
    );
  }

  const Icon = config.icon;

  return (
    <div
      className="group relative flex min-w-[90px] flex-1 flex-col justify-between rounded-md border border-zinc-800/80 bg-zinc-950/70 px-2.5 py-1.5 transition-all hover:border-cyan-500/40 sm:min-w-[110px]"
      aria-label={`${config.name}: ${value.toFixed(1)} of ${capacity}`}
      role="group"
      title={`${config.name}: ${value.toFixed(1)} / ${capacity}`}
    >
      <div className="flex items-center justify-between gap-1 text-[10px]">
        <span className="flex items-center gap-1 font-semibold tracking-wider text-zinc-400 group-hover:text-cyan-300 transition-colors">
          <Icon className="h-3 w-3 text-cyan-400" />
          {config.label}
        </span>
        <div className="flex items-center gap-1 font-hud">
          {statusBadge}
          <strong className={`tabular-nums text-xs font-bold ${textStyle}`}>
            {Number.isInteger(value) ? value : value.toFixed(1)}
          </strong>
        </div>
      </div>

      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-900 border border-zinc-800/70" aria-hidden="true">
        <div
          className={`h-full bg-gradient-to-r ${barGradient} transition-all duration-300`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-1 flex items-center justify-between text-[8px] text-zinc-500 font-hud">
        <span>{mode === 'cadet' ? (isZeroCritical ? 'CRITICAL' : isWarningAmber ? 'LOW' : 'STABLE') : `${percent.toFixed(0)}%`}</span>
        <span className="text-zinc-600">CAP {capacity}</span>
      </div>
    </div>
  );
}

export default function ResourceBar() {
  const mode = useGameStore((state) => state.mode);
  const days = useGameStore((state) => state.daysPassed);
  const scenario = useGameStore((state) => state.scenario);
  const resources = useGameStore((state) => state.resources);
  const radiationLimit = useGameStore((state) => state.resourceCaps.radiationDose);
  const activeEvents = useGameStore((state) => state.activeEvents);

  const shown = mode === 'cadet' ? resourceConfigs.slice(0, 4) : resourceConfigs;
  const isEmergency = resources.oxygen <= 0 || resources.power <= 0 || resources.water <= 0;
  const hasWarning = activeEvents.some((e) => e.warned || e.active);

  return (
    <header className="glass-hud fixed top-0 left-0 right-0 z-40 flex flex-wrap items-center justify-between gap-2 border-x-0 border-t-0 px-3 py-2 sm:px-6">
      {/* Station Brand & Mission Clock */}
      <div className="flex items-center gap-3">
        <div className={`relative flex items-center justify-center rounded-lg border p-2 transition-colors ${
          isEmergency
            ? 'border-red-500 bg-red-950/80 text-red-400 emergency-strobe'
            : hasWarning
              ? 'border-amber-500/80 bg-amber-950/60 text-amber-300'
              : 'border-cyan-500/40 bg-cyan-950/60 text-cyan-300'
        }`}>
          <Activity className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${
              isEmergency ? 'bg-red-400' : hasWarning ? 'bg-amber-400' : 'bg-cyan-400'
            } opacity-75`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${
              isEmergency ? 'bg-red-500' : hasWarning ? 'bg-amber-500' : 'bg-cyan-500'
            }`} />
          </span>
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs font-black uppercase tracking-[0.22em] text-zinc-100 sm:text-sm">
              Outpost Zero
            </h1>
            <span className="rounded bg-cyan-950/80 px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-widest text-cyan-300 border border-cyan-800/60">
              HUD v2.5
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.18em] text-zinc-400">
            <Radio className="h-2.5 w-2.5 text-cyan-400" />
            <span>{scenario}</span>
            <span className="text-zinc-600">·</span>
            <span>{mode}</span>
          </p>
        </div>

        {/* Day Clock */}
        <div className="rounded-lg border border-cyan-500/40 bg-zinc-950/90 px-3 py-1 font-hud text-xs font-bold text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <span className="text-[9px] font-normal tracking-widest text-zinc-500 mr-1.5">MISSION</span>
          DAY {String(days).padStart(2, '0')} / 30
        </div>
      </div>

      {/* Active Event Alert Ribbon if any */}
      {activeEvents.length > 0 && (
        <div className="hidden lg:flex items-center gap-2">
          {activeEvents.slice(0, 1).map((event) => (
            <div
              key={event.id}
              role="status"
              className="flex items-center gap-1.5 rounded-md border border-amber-600/70 bg-amber-950/70 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-amber-200 animate-pulse"
            >
              <AlertTriangle className="h-3 w-3 text-amber-400" />
              <span>{event.warned ? 'WARNING' : 'EVENT'}: {event.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Resource Telemetry Gauges */}
      <div className="flex w-full items-center gap-1.5 overflow-x-auto sm:w-auto sm:gap-2">
        {shown.map((cfg) => (
          <ResourceGauge key={cfg.key} config={cfg} />
        ))}
        {mode === 'cadet' && (
          <div
            className="hidden xl:flex flex-col justify-center rounded border border-purple-900/60 bg-purple-950/40 px-2 py-1 text-[8px] font-hud text-purple-300"
            aria-label="Radiation dose"
          >
            <span className="text-[7px] text-zinc-400 uppercase tracking-widest">RAD DOSE</span>
            <strong>{resources.radiationDose.toFixed(1)} / {radiationLimit}</strong>
          </div>
        )}
      </div>
    </header>
  );
}
