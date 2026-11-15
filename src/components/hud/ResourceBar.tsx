import { Activity, Box, Droplet, Shield, Wind, Zap } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import type { ResourceKey } from '../../engine/types';

const resourceItems: Array<{
  key: ResourceKey;
  label: string;
  name: string;
  icon: typeof Wind;
  color: string;
}> = [
  { key: 'oxygen', label: 'O₂', name: 'Oxygen', icon: Wind, color: 'bg-sky-400' },
  { key: 'power', label: 'PWR', name: 'Power', icon: Zap, color: 'bg-amber-400' },
  { key: 'water', label: 'H₂O', name: 'Water', icon: Droplet, color: 'bg-blue-400' },
  { key: 'food', label: 'FOOD', name: 'Food', icon: Box, color: 'bg-emerald-400' },
  { key: 'radiationDose', label: 'RAD', name: 'Radiation dose', icon: Shield, color: 'bg-violet-400' },
];

function percentage(value: number, capacity: number): number {
  return Math.max(0, Math.min(100, (value / capacity) * 100));
}

function hint(value: number, capacity: number, radiation: boolean): string {
  if (radiation) return value >= capacity * 0.7 ? 'Exposure nearing limit' : 'Cumulative dose';
  if (value <= capacity * 0.2) return 'Critical reserve';
  if (value <= capacity * 0.45) return 'Reserve falling';
  return 'Reserve stable';
}

function ResourceGauge({ resource }: { resource: (typeof resourceItems)[number] }) {
  const value = useGameStore((state) => state.resources[resource.key]);
  const capacity = useGameStore((state) => state.resourceCaps[resource.key]);
  const mode = useGameStore((state) => state.mode);
  const percent = percentage(value, capacity);
  const radiation = resource.key === 'radiationDose';
  const critical = radiation ? percent >= 70 : percent <= 20;
  const Icon = resource.icon;

  return (
    <div
      className="min-w-[78px] flex-1 rounded border border-zinc-800 bg-zinc-900/80 px-2 py-1.5 sm:min-w-[95px] sm:px-2.5"
      aria-label={`${resource.name}: ${value.toFixed(1)} of ${capacity}`}
      role="group"
      title={`${resource.name}: ${value.toFixed(1)} / ${capacity}`}
    >
      <div className={`flex items-center justify-between gap-1 font-hud text-[10px] ${critical ? 'animate-pulse text-red-300' : 'text-zinc-200'}`}>
        <span className="flex items-center gap-1"><Icon className="h-3 w-3" />{resource.label}</span>
        <span className="flex items-center gap-1">
          {critical && <span className="text-[8px] font-black uppercase">{radiation ? 'High' : 'Low'}</span>}
          <strong className="tabular-nums">{Number.isInteger(value) ? value : value.toFixed(1)}</strong>
        </span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded bg-zinc-800" aria-hidden="true">
        <div className={`h-full transition-[width] ${critical ? 'bg-red-400' : resource.color}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 hidden truncate text-[9px] text-zinc-500 sm:block">
        {mode === 'cadet' ? hint(value, capacity, radiation) : `${percent.toFixed(0)}% capacity`}
      </p>
    </div>
  );
}

export default function ResourceBar() {
  const mode = useGameStore((state) => state.mode);
  const days = useGameStore((state) => state.daysPassed);
  const scenario = useGameStore((state) => state.scenario);
  const resources = useGameStore((state) => state.resources);
  const radiationLimit = useGameStore((state) => state.resourceCaps.radiationDose);
  const shown = mode === 'cadet' ? resourceItems.slice(0, 4) : resourceItems;

  return (
    <header className="glass-panel z-10 flex flex-none flex-wrap items-center justify-between gap-2 border-x-0 border-t-0 px-3 py-2.5 sm:px-5">
      <div className="flex items-center gap-2.5">
        <div className="rounded border border-cyan-500/30 bg-cyan-950/50 p-2 text-cyan-300"><Activity className="h-5 w-5" /></div>
        <div>
          <h1 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-100 sm:text-sm">Outpost Zero</h1>
          <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">{scenario} · {mode}</p>
        </div>
        <div className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 font-hud text-[10px] text-cyan-300 sm:text-xs">
          DAY {String(days).padStart(2, '0')} / 30
        </div>
      </div>
      <div className="flex w-full gap-1.5 overflow-x-auto sm:w-auto sm:gap-2">
        {shown.map((resource) => <ResourceGauge key={resource.key} resource={resource} />)}
      </div>
      {mode === 'cadet' && (
        <p className="w-full text-right text-[9px] text-violet-300 sm:w-auto" aria-label="Radiation dose">
          ☢ Dose {resources.radiationDose.toFixed(1)} / {radiationLimit}
        </p>
      )}
    </header>
  );
}