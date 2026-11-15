
import {
  Activity,
  AlertTriangle,
  Box,
  Droplet,
  Radio,
  Shield,
  Wind,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import type { ResourceKey } from '../../engine/types';

interface ResourceConfig {
  key: ResourceKey;
  label: string;
  name: string;
  icon: LucideIcon;
  accentColor: string;
}

type ResourceStatus = 'critical' | 'warning' | 'nominal';

const RESOURCE_CONFIGS: ResourceConfig[] = [
  {
    key: 'oxygen',
    label: 'O₂',
    name: 'Oxygen',
    icon: Wind,
    accentColor: 'from-cyan-500 to-sky-400',
  },
  {
    key: 'power',
    label: 'PWR',
    name: 'Power',
    icon: Zap,
    accentColor: 'from-amber-400 to-yellow-300',
  },
  {
    key: 'water',
    label: 'H₂O',
    name: 'Water',
    icon: Droplet,
    accentColor: 'from-blue-500 to-cyan-400',
  },
  {
    key: 'food',
    label: 'FOOD',
    name: 'Food',
    icon: Box,
    accentColor: 'from-emerald-500 to-teal-400',
  },
  {
    key: 'radiationDose',
    label: 'RAD',
    name: 'Radiation dose',
    icon: Shield,
    accentColor: 'from-purple-500 to-violet-400',
  },
];

const STATUS_STYLES: Record<
  ResourceStatus,
  {
    text: string;
    bar: string;
    badge: string;
    label: string;
  }
> = {
  critical: {
    text: 'text-red-400 text-glow-red',
    bar: 'from-red-600 to-red-400',
    badge: 'border-red-700/50 bg-red-950/80 text-red-300',
    label: 'CRITICAL',
  },
  warning: {
    text: 'text-amber-300 text-glow-amber',
    bar: 'from-amber-500 to-orange-400',
    badge: 'border-amber-700/50 bg-amber-950/80 text-amber-300',
    label: 'WARNING',
  },
  nominal: {
    text: 'text-cyan-200 text-glow-cyan',
    bar: '',
    badge: '',
    label: 'STABLE',
  },
};

function clampPercentage(value: number, capacity: number): number {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(capacity) ||
    capacity <= 0
  ) {
    return 0;
  }

  return Math.max(0, Math.min(100, (value / capacity) * 100));
}

function formatResourceValue(value: number): string {
  if (!Number.isFinite(value)) return '—';

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getResourceStatus(
  key: ResourceKey,
  value: number,
  percent: number,
): ResourceStatus {
  if (key === 'radiationDose') {
    if (percent >= 95) return 'critical';
    if (percent >= 65) return 'warning';
    return 'nominal';
  }

  if (value <= 0) return 'critical';
  if (value < 20) return 'warning';

  return 'nominal';
}

function ResourceGauge({ config }: { config: ResourceConfig }) {
  const value = useGameStore(
    (state) => state.resources[config.key],
  );

  const capacity = useGameStore(
    (state) => state.resourceCaps[config.key],
  );

  const mode = useGameStore((state) => state.selectedMode);

  const safeValue = Number.isFinite(value) ? value : 0;
  const safeCapacity = Number.isFinite(capacity) ? capacity : 0;

  const percent = clampPercentage(safeValue, safeCapacity);
  const isRadiation = config.key === 'radiationDose';

  const status = getResourceStatus(
    config.key,
    safeValue,
    percent,
  );

  const styles = STATUS_STYLES[status];
  const Icon = config.icon;

  const displayStatus =
    status === 'critical'
      ? 'CRITICAL'
      : status === 'warning'
        ? 'LOW'
        : 'STABLE';

  const barGradient =
    status === 'nominal'
      ? config.accentColor
      : styles.bar;

  return (
    <div
      className={[
        'group relative flex min-w-[100px] flex-1 flex-col justify-between',
        'rounded-md border border-zinc-800/80 bg-zinc-950/80',
        'px-2.5 py-1.5 transition-colors duration-200',
        'hover:border-cyan-500/40',
        status === 'critical' ? 'border-red-900/70' : '',
      ].join(' ')}
      role="group"
      aria-label={`${config.name}: ${formatResourceValue(safeValue)} of ${formatResourceValue(safeCapacity)}`}
      title={`${config.name}: ${formatResourceValue(safeValue)} / ${formatResourceValue(safeCapacity)}`}
      data-resource={config.key}
      data-status={status}
    >
      {/* Resource label and current value */}
      <div className="flex items-center justify-between gap-1 text-[10px]">
        <span className="flex min-w-0 items-center gap-1 font-semibold tracking-wider text-zinc-400 transition-colors group-hover:text-cyan-300">
          <Icon
            className="h-3 w-3 shrink-0 text-cyan-400"
            aria-hidden="true"
          />
          <span>{config.label}</span>
        </span>

        <div className="flex shrink-0 items-center gap-1 font-hud">
          {status !== 'nominal' && (
            <span
              className={`rounded border px-1 py-0.5 text-[8px] font-black uppercase tracking-wider ${styles.badge}`}
            >
              {status === 'critical' ? 'ALERT' : 'WARN'}
            </span>
          )}

          <strong
            className={`tabular-nums text-xs font-bold ${styles.text} ${
              status === 'critical' ? 'animate-pulse' : ''
            }`}
          >
            {formatResourceValue(safeValue)}
          </strong>
        </div>
      </div>

      {/* Resource level */}
      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full border border-zinc-800/70 bg-zinc-900"
        role="progressbar"
        aria-label={`${config.name} level`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-valuetext={`${Math.round(percent)} percent`}
      >
        <div
          className={[
            'h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ease-out',
            barGradient,
            status === 'critical' ? 'animate-pulse' : '',
          ].join(' ')}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Resource status and capacity */}
      <div className="mt-1 flex items-center justify-between gap-1 font-hud text-[8px] text-zinc-500">
        <span
          className={
            status === 'critical'
              ? 'font-bold text-red-400'
              : status === 'warning'
                ? 'font-bold text-amber-300'
                : 'text-zinc-500'
          }
        >
          {mode === 'cadet' ? displayStatus : `${Math.round(percent)}%`}
        </span>

        <span className="truncate text-zinc-600">
          CAP {formatResourceValue(safeCapacity)}
        </span>
      </div>

      {isRadiation && status !== 'nominal' && (
        <span className="sr-only">
          Radiation exposure is {status}.
        </span>
      )}
    </div>
  );
}

export default function ResourceBar() {
  const mode = useGameStore((state) => state.selectedMode);
  const days = useGameStore((state) => state.daysPassed);
  const scenario = useGameStore((state) => state.selectedScenario);
  const resources = useGameStore((state) => state.resources);
  const radiationLimit = useGameStore(
    (state) => state.resourceCaps.radiationDose,
  );
  const activeEvents = useGameStore((state) => state.activeEvents);

  const hasSolarEvent = activeEvents.some(
    (event) => event.type === 'solar-particle-event',
  );

  const hasDustStorm = activeEvents.some(
    (event) => event.type === 'dust-storm',
  );

  const hasLunarNight = activeEvents.some(
    (event) => event.type === 'lunar-night',
  );

  const hasWarning = activeEvents.some(
    (event) => event.warned || event.active,
  );

  const isEmergency =
    resources.oxygen <= 0 ||
    resources.power <= 0 ||
    resources.water <= 0;

  const environmentTelemetry = hasSolarEvent
    ? 'SOLAR PARTICLE EXPOSURE'
    : scenario === 'mars'
      ? hasDustStorm
        ? 'DUST FRONT · SOLAR OUTPUT REDUCED'
        : 'REGOLITH · DUST MONITOR'
      : hasLunarNight
        ? 'LUNAR NIGHT · THERMAL WATCH'
        : 'VACUUM · THERMAL FLUCTUATION';

  const environmentColor =
    hasSolarEvent || hasDustStorm || hasLunarNight
      ? 'text-amber-300'
      : scenario === 'mars'
        ? 'text-orange-300/75'
        : 'text-sky-200/75';

  const shownResources =
    mode === 'cadet'
      ? RESOURCE_CONFIGS.slice(0, 4)
      : RESOURCE_CONFIGS;

  const statusColor = isEmergency
    ? 'red'
    : hasWarning
      ? 'amber'
      : 'cyan';

  const indicatorStyles = {
    red: {
      container: 'border-red-500 bg-red-950/80 text-red-400',
      ping: 'bg-red-400',
      dot: 'bg-red-500',
    },
    amber: {
      container: 'border-amber-500/80 bg-amber-950/60 text-amber-300',
      ping: 'bg-amber-400',
      dot: 'bg-amber-500',
    },
    cyan: {
      container: 'border-cyan-500/40 bg-cyan-950/60 text-cyan-300',
      ping: 'bg-cyan-400',
      dot: 'bg-cyan-500',
    },
  }[statusColor];

  const primaryEvent = activeEvents.find(
    (event) => event.active,
  ) ?? activeEvents.find(
    (event) => event.warned,
  );

  return (
    <header
      data-scenario={scenario}
      data-mode={mode}
      data-emergency={isEmergency}
      className={[
        'glass-hud fixed inset-x-0 top-0 z-40',
        'flex flex-wrap items-center justify-between gap-2',
        'border-x-0 border-t-0 px-3 py-2 sm:px-6',
      ].join(' ')}
      aria-label="Outpost mission telemetry"
    >
      {/* Station identity and mission clock */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <div
          className={`relative flex shrink-0 items-center justify-center rounded-lg border p-2 transition-colors ${indicatorStyles.container} ${
            isEmergency ? 'emergency-strobe' : ''
          }`}
          aria-label={
            isEmergency
              ? 'Station emergency'
              : hasWarning
                ? 'Station warning'
                : 'Station nominal'
          }
        >
          <Activity className="h-4 w-4" aria-hidden="true" />

          <span
            className="absolute -right-0.5 -top-0.5 flex h-2 w-2"
            aria-hidden="true"
          >
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${indicatorStyles.ping}`}
            />
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${indicatorStyles.dot}`}
            />
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h1 className="text-xs font-black uppercase tracking-[0.22em] text-zinc-100 sm:text-sm">
              Outpost Zero
            </h1>

            <span className="rounded border border-cyan-800/60 bg-cyan-950/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-cyan-300">
              HUD v2.5
            </span>
          </div>

          <p className="flex flex-wrap items-center gap-1.5 text-[9px] uppercase tracking-[0.18em] text-zinc-400">
            <Radio
              className="h-2.5 w-2.5 text-cyan-400"
              aria-hidden="true"
            />

            <span
              className={
                scenario === 'mars'
                  ? 'text-orange-300'
                  : 'text-sky-200'
              }
            >
              {scenario === 'mars'
                ? 'Mars Outpost'
                : 'Lunar Station'}
            </span>

            <span className="text-zinc-600" aria-hidden="true">
              ·
            </span>

            <span>{mode}</span>
          </p>

          <p
            className={`mt-0.5 text-[7px] font-hud uppercase tracking-[0.14em] ${environmentColor}`}
            role="status"
          >
            {environmentTelemetry}
          </p>
        </div>

        {/* Mission day */}
        <div
          className="rounded-lg border border-cyan-500/40 bg-zinc-950/90 px-3 py-1 font-hud text-xs font-bold text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          aria-label={`Mission day ${days} of 30`}
        >
          <span className="mr-1.5 text-[9px] font-normal tracking-widest text-zinc-500">
            MISSION
          </span>

          DAY {String(days).padStart(2, '0')} / 30
        </div>
      </div>

      {/* Active event alert */}
      {primaryEvent && (
        <div className="hidden items-center gap-2 lg:flex">
          <div
            key={primaryEvent.id}
            role="status"
            className={[
              'flex max-w-64 items-center gap-1.5 rounded-md border',
              'border-amber-600/70 bg-amber-950/70 px-2.5 py-1',
              'text-[9px] font-black uppercase tracking-wider text-amber-200',
              primaryEvent.active ? 'animate-pulse' : '',
            ].join(' ')}
          >
            <AlertTriangle
              className="h-3 w-3 shrink-0 text-amber-400"
              aria-hidden="true"
            />

            <span className="truncate">
              {primaryEvent.warned ? 'WARNING' : 'EVENT'}:{' '}
              {primaryEvent.name}
            </span>
          </div>
        </div>
      )}

      {/* Resource telemetry */}
      <div
        className="flex w-full items-stretch gap-1.5 overflow-x-auto pb-0.5 sm:w-auto sm:max-w-full sm:gap-2"
        aria-label="Station resource levels"
      >
        {shownResources.map((config) => (
          <ResourceGauge
            key={config.key}
            config={config}
          />
        ))}

        {/* Cadet mode compact radiation display */}
        {mode === 'cadet' && (
          <div
            className="hidden min-w-[90px] flex-col justify-center rounded border border-purple-900/60 bg-purple-950/40 px-2 py-1 font-hud text-purple-300 xl:flex"
            aria-label={`Radiation dose: ${formatResourceValue(resources.radiationDose)} of ${formatResourceValue(radiationLimit)}`}
          >
            <span className="text-[7px] uppercase tracking-widest text-zinc-400">
              RAD DOSE
            </span>

            <strong className="text-[10px] tabular-nums">
              {formatResourceValue(resources.radiationDose)} /{' '}
              {formatResourceValue(radiationLimit)}
            </strong>
          </div>
        )}
      </div>
    </header>
  );
}
