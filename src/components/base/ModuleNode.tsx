import {
  Battery,
  Box,
  Droplet,
  Home,
  Shield,
  Sprout,
  Sun,
  Wind,
  Zap,
  Wrench,
} from 'lucide-react';
import type { OutpostModule } from '../../engine/types';

const moduleIcons = {
  solar_panel: Sun,
  reactor: Zap,
  battery: Battery,
  o2_generator: Wind,
  water_reclaimer: Droplet,
  greenhouse: Sprout,
  regolith_shield: Shield,
  storm_shelter: Shield,
  habitat: Home,
} as const;

interface ModuleNodeProps {
  module: OutpostModule;
  day: number;
  selected: boolean;
  onSelect: () => void;
  onRepair?: () => void;
}

export default function ModuleNode({
  module,
  day,
  selected,
  onSelect,
  onRepair,
}: ModuleNodeProps) {
  const offline = (module.offlineUntilDay ?? 0) > day;
  const Icon = moduleIcons[module.moduleType] ?? Box;
  return (
    <article
      className={`relative rounded-lg border p-3 transition ${
        offline
          ? 'border-red-900 bg-red-950/40'
          : selected
            ? 'border-cyan-600 bg-cyan-950/30'
            : 'border-zinc-700 bg-zinc-900/90 hover:border-cyan-800'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`${module.name}, ${offline ? 'offline' : 'online'}, power priority ${module.powerPriority}`}
        className="min-h-24 w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        <div className="flex items-start justify-between">
          <Icon className={`h-5 w-5 ${offline ? 'text-red-300' : 'text-cyan-300'}`} />
          <span className="font-hud text-[9px] text-zinc-600">D{module.deployedDay ?? 0}</span>
        </div>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-100">{module.name}</p>
        <p className={`mt-1 text-[9px] ${offline ? 'text-red-300' : 'text-emerald-400'}`}>
          {offline ? `OFFLINE · until D${module.offlineUntilDay}` : 'ONLINE'}
        </p>
      </button>
      {offline && onRepair && (
        <button
          type="button"
          onClick={onRepair}
          className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded border border-red-800 px-2 text-[9px] font-bold uppercase tracking-wide text-red-200 hover:bg-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <Wrench className="h-3 w-3" /> Repair
        </button>
      )}
    </article>
  );
}