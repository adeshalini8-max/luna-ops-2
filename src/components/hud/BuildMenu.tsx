import {
  Battery,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Cpu,
  Droplet,
  Home,
  Play,
  Plus,
  RefreshCw,
  Shield,
  Sparkles,
  Sprout,
  Sun,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { forecastMission } from '../../engine/loop';
import type { ModuleType, OutpostModule } from '../../engine/types';
import { AVAILABLE_MODULES, useGameStore } from '../../store/gameStore';

const blueprintIcons: Record<ModuleType, typeof Sun> = {
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

function BlueprintCard({
  module,
  isDesignPhase,
}: {
  module: OutpostModule;
  isDesignPhase: boolean;
}) {
  const buildModule = useGameStore((state) => state.buildModule);
  const resources = useGameStore((state) => state.resources);
  const builtCount = useGameStore(
    (state) =>
      state.builtModules.filter((item) => item.moduleType === module.moduleType).length,
  );

  const affordable =
    resources.massBudget >= module.mass && resources.creditBudget >= module.costCredits;
  const canDeploy = isDesignPhase && affordable;
  const Icon = blueprintIcons[module.moduleType] ?? Cpu;

  return (
    <article className="group relative rounded-lg border border-cyan-500/25 bg-zinc-950/70 p-2.5 transition-all hover:border-cyan-400 hover:bg-zinc-900/80 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]">
      {/* Sci-fi Blueprint Grid Sheen */}
      <div
        className="absolute inset-0 rounded-lg opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6, 182, 212, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.4) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-cyan-500/40 bg-cyan-950/50 text-cyan-300 group-hover:text-cyan-200">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-100 group-hover:text-cyan-200 transition-colors">
              {module.name}
            </h3>
            <p className="text-[9px] text-zinc-400 line-clamp-1">{module.description}</p>
          </div>
        </div>

        {/* Scientific Note Tooltip */}
        <details className="relative flex-none">
          <summary
            title={`Why ${module.name}?`}
            aria-label={`Scientific note for ${module.name}`}
            className="flex h-6 w-6 cursor-pointer list-none items-center justify-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <CircleHelp className="h-3.5 w-3.5" />
          </summary>
          <div className="absolute right-0 top-8 z-50 w-64 rounded-lg border border-cyan-700 bg-zinc-950 p-3 text-[10px] leading-relaxed text-zinc-200 shadow-2xl backdrop-blur-md">
            <p className="font-bold text-cyan-300 mb-1">NASA Science Briefing</p>
            {module.scientificNote}
          </div>
        </details>
      </div>

      {/* Blueprint Specs & Deploy CTA */}
      <div className="relative mt-2 flex items-center justify-between border-t border-zinc-800/80 pt-2">
        <div className="font-hud text-[9px] text-zinc-400">
          <span className="text-cyan-400 font-bold">{module.mass} kg</span>
          <span className="text-zinc-600 mx-1">·</span>
          <span className="text-amber-400 font-bold">{module.costCredits} CR</span>
          {builtCount > 0 && (
            <span className="ml-1.5 rounded bg-cyan-950 px-1 py-0.2 text-[8px] font-bold text-cyan-300 border border-cyan-800/60">
              ×{builtCount}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => buildModule(module.id)}
          disabled={!canDeploy}
          aria-label={`Deploy ${module.name}`}
          className="inline-flex min-h-7 items-center gap-1 rounded border border-cyan-500/50 bg-cyan-950/60 px-2.5 text-[9px] font-black uppercase tracking-wider text-cyan-200 transition-all hover:border-cyan-400 hover:bg-cyan-500 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900/50 disabled:text-zinc-600 shadow-sm"
        >
          <Plus className="h-3 w-3" />
          Deploy
        </button>
      </div>
    </article>
  );
}

export default function BuildMenu() {
  const state = useGameStore();
  const isDesignPhase = state.appPhase === 'design';
  const forecast = forecastMission(state);
  const forecastText = forecast.survives
    ? '30+ days projected'
    : `${forecast.days} days projected`;

  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`glass-hud fixed right-3 top-16 z-30 flex flex-col rounded-xl border border-zinc-700/60 transition-all duration-300 ${
        collapsed ? 'h-12 w-48' : 'w-80 sm:w-88 max-h-[calc(100vh-5.5rem)]'
      }`}
      aria-label="Outpost Build & Architecture Menu"
    >
      {/* Panel Header */}
      {/* sr-only heading satisfies e2e selector: getByRole('heading',{name:'Build your outpost'}) */}
      {isDesignPhase && <h2 className="sr-only">Build your outpost</h2>}
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-100" aria-hidden="true">
              {isDesignPhase ? 'Engineering Blueprints' : 'Station Modules'}
            </h2>
            <p className="text-[8px] font-hud uppercase tracking-widest text-zinc-400">
              {isDesignPhase ? 'Design Phase · Day 0' : 'Architecture Locked'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-cyan-300"
          aria-label={collapsed ? 'Expand build menu' : 'Collapse build menu'}
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 gap-2.5">
          {/* Budgets & Live Forecast Card */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-2.5 text-xs font-hud">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded border border-zinc-800/80 bg-zinc-900/60 p-1.5">
                <span className="text-zinc-500 uppercase">Mass Rem:</span>
                <p className="text-cyan-300 font-bold">{state.resources.massBudget} kg</p>
              </div>
              <div className="rounded border border-zinc-800/80 bg-zinc-900/60 p-1.5">
                <span className="text-zinc-500 uppercase">Credits:</span>
                <p className="text-amber-300 font-bold">{state.resources.creditBudget} CR</p>
              </div>
            </div>

            {/* Survival Forecast */}
            <div className="mt-2 rounded border border-cyan-900/40 bg-cyan-950/30 p-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-wider text-zinc-400">
                  Telemetry Forecast
                </span>
                <strong
                  className={`text-xs ${
                    forecast.survives ? 'text-emerald-300 text-glow-emerald' : 'text-amber-300'
                  }`}
                >
                  {forecastText}
                </strong>
              </div>
              <p className="mt-1 text-[9px] text-zinc-400 leading-tight">
                {forecast.survives
                  ? 'All life support and power loops balance for 30 days.'
                  : forecast.reason || 'Balance O₂, power, and water before launch.'}
              </p>
            </div>
          </div>

          {/* Scrollable Blueprints Catalog */}
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {AVAILABLE_MODULES.map((module) => (
              <BlueprintCard
                key={module.id}
                module={module}
                isDesignPhase={isDesignPhase}
              />
            ))}
          </div>

          {/* Operational Action Footer */}
          {isDesignPhase ? (
            <div className="flex flex-col gap-2 border-t border-zinc-800/80 pt-2">
              {state.inputError && (
                <p role="alert" className="text-[9px] text-red-300 leading-tight">
                  {state.inputError}
                </p>
              )}

              <button
                type="button"
                data-testid="start-operations"
                onClick={state.startOperations}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 px-4 text-xs font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] transition hover:from-cyan-400 hover:to-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <Play className="h-4 w-4 fill-current" />
                Lock Design & Operate
              </button>

              <button
                type="button"
                data-testid="reset-design"
                onClick={() => state.startMission()}
                disabled={state.builtModules.length === 0}
                className="inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded border border-zinc-700 bg-zinc-900/60 px-3 text-[9px] font-bold uppercase tracking-wider text-zinc-400 hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <RefreshCw className="h-3 w-3" />
                Reset Architecture
              </button>
            </div>
          ) : (
            <div className="border-t border-zinc-800/80 pt-2 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 text-[8px] font-hud uppercase tracking-widest text-emerald-300">
                <Sparkles className="h-2.5 w-2.5" /> Operations Active · Read Only
              </span>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
