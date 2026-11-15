
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
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { forecastMission } from '../../engine/loop';
import type { ModuleType, OutpostModule } from '../../engine/types';
import { AVAILABLE_MODULES, useGameStore } from '../../store/gameStore';

/* ================================================================
   TYPES AND CONFIGURATION
================================================================ */

interface BlueprintCardProps {
  module: OutpostModule;
  isDesignPhase: boolean;
}

const blueprintIcons: Record<ModuleType, LucideIcon> = {
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

const moduleDescriptions: Record<ModuleType, string> = {
  solar_panel: 'Solar energy generation system',
  reactor: 'Continuous nuclear power generation',
  battery: 'Electrical energy storage system',
  o2_generator: 'Atmospheric oxygen production',
  water_reclaimer: 'Water recovery and purification',
  greenhouse: 'Controlled food production facility',
  regolith_shield: 'Radiation protection infrastructure',
  storm_shelter: 'Emergency environmental protection',
  habitat: 'Pressurized crew living quarters',
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
  }).format(value);
}

/* ================================================================
   BLUEPRINT CARD
================================================================ */

function BlueprintCard({
  module,
  isDesignPhase,
}: BlueprintCardProps) {
  const buildModule = useGameStore((state) => state.buildModule);

  const resources = useGameStore((state) => state.resources);

  const builtCount = useGameStore((state) =>
    state.builtModules.filter(
      (item) => item.moduleType === module.moduleType,
    ).length,
  );

  const hasMass = resources.massBudget >= module.mass;
  const hasCredits = resources.creditBudget >= module.costCredits;

  const affordable = hasMass && hasCredits;
  const canDeploy = isDesignPhase && affordable;

  const Icon = blueprintIcons[module.moduleType] ?? Cpu;

  const disabledReason = !isDesignPhase
    ? 'Architecture is locked during operations'
    : !hasMass
      ? `Requires ${module.mass - resources.massBudget} kg additional mass`
      : !hasCredits
        ? `Requires ${module.costCredits - resources.creditBudget} additional credits`
        : undefined;

  const handleDeploy = () => {
    if (!canDeploy) return;
    buildModule(module.id);
  };

  return (
    <article
      className={[
        'group relative isolate overflow-visible rounded-lg border p-3',
        'border-cyan-500/20 bg-zinc-950/75',
        'transition-[border-color,background-color,box-shadow] duration-200',
        canDeploy
          ? 'hover:border-cyan-400/70 hover:bg-zinc-900/90 hover:shadow-[0_0_18px_rgba(6,182,212,.12)]'
          : 'opacity-80',
      ].join(' ')}
      data-module-type={module.moduleType}
      data-can-deploy={canDeploy}
    >
      {/* Blueprint grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-lg opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6,182,212,.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6,182,212,.5) 1px, transparent 1px)
          `,
          backgroundSize: '16px 16px',
        }}
      />

      {/* Card header */}
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <div
            className={[
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
              'border-cyan-500/35 bg-cyan-950/60 text-cyan-300',
              'transition-colors duration-200',
              canDeploy ? 'group-hover:border-cyan-400/70 group-hover:text-cyan-200' : '',
            ].join(' ')}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xs font-bold tracking-wide text-zinc-100 transition-colors group-hover:text-cyan-200">
              {module.name}
            </h3>

            <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-zinc-400">
              {module.description}
            </p>

            <p className="mt-1 text-[8px] tracking-wide text-zinc-600">
              {moduleDescriptions[module.moduleType]}
            </p>
          </div>
        </div>

        {/* Scientific information */}
        <details className="group/info relative z-30 shrink-0">
          <summary
            title={`Scientific briefing for ${module.name}`}
            aria-label={`Scientific briefing for ${module.name}`}
            className={[
              'flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-md',
              'text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-cyan-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
              '[&::-webkit-details-marker]:hidden',
            ].join(' ')}
          >
            <CircleHelp className="h-4 w-4" aria-hidden="true" />
          </summary>

          <div className="absolute right-0 top-9 z-50 w-64 max-w-[calc(100vw-3rem)] rounded-lg border border-cyan-700/70 bg-zinc-950 p-3 text-[10px] leading-relaxed text-zinc-200 shadow-2xl">
            <div className="mb-2 flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              <p className="font-bold uppercase tracking-wider text-cyan-300">
                Scientific Briefing
              </p>
            </div>

            <p className="whitespace-pre-line text-zinc-300">
              {module.scientificNote}
            </p>
          </div>
        </details>
      </div>

      {/* Module specifications */}
      <div className="relative mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-2.5">
        <div className="flex flex-wrap items-center gap-2 font-hud text-[9px]">
          <span
            className="rounded border border-cyan-900/60 bg-cyan-950/40 px-1.5 py-1 font-bold text-cyan-300"
            title="Module mass"
          >
            {formatNumber(module.mass)} kg
          </span>

          <span
            className="rounded border border-amber-900/60 bg-amber-950/30 px-1.5 py-1 font-bold text-amber-300"
            title="Construction cost"
          >
            {formatNumber(module.costCredits)} CR
          </span>

          {builtCount > 0 && (
            <span
              className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-1 font-bold text-zinc-300"
              aria-label={`${builtCount} already deployed`}
              title={`${builtCount} already deployed`}
            >
              DEPLOYED ×{builtCount}
            </span>
          )}
        </div>

        {/* Deployment button */}
        <button
          type="button"
          onClick={handleDeploy}
          disabled={!canDeploy}
          title={disabledReason ?? `Deploy ${module.name}`}
          aria-label={`Deploy ${module.name}`}
          className={[
            'inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border px-3',
            'text-[9px] font-black uppercase tracking-wider',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
            'disabled:cursor-not-allowed disabled:border-zinc-800',
            'disabled:bg-zinc-900/70 disabled:text-zinc-600',
            canDeploy
              ? 'border-cyan-500/60 bg-cyan-950/70 text-cyan-200 hover:border-cyan-300 hover:bg-cyan-400 hover:text-zinc-950 active:scale-[0.97]'
              : '',
          ].join(' ')}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Deploy
        </button>
      </div>

      {/* Resource affordability indicators */}
      {!affordable && isDesignPhase && (
        <div
          className="relative mt-2 flex flex-wrap gap-2 text-[8px] font-semibold"
          role="status"
        >
          {!hasMass && (
            <span className="flex items-center gap-1 text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              INSUFFICIENT MASS
            </span>
          )}

          {!hasCredits && (
            <span className="flex items-center gap-1 text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              INSUFFICIENT CREDITS
            </span>
          )}
        </div>
      )}

      {!isDesignPhase && (
        <p className="sr-only">
          Deployment is unavailable during the operations phase.
        </p>
      )}
    </article>
  );
}

/* ================================================================
   BUILD MENU
================================================================ */

export default function BuildMenu() {
  const state = useGameStore();

  const [collapsed, setCollapsed] = useState(false);

  const isDesignPhase = state.appPhase === 'design';

  const forecast = useMemo(
    () => forecastMission(state),
    [state],
  );

  const forecastText = forecast.survives
    ? '30+ DAYS PROJECTED'
    : `${forecast.days} DAYS PROJECTED`;

  const moduleCount = state.builtModules.length;

  const massBudget = state.resources.massBudget;
  const creditBudget = state.resources.creditBudget;

  const hasInputError = Boolean(state.inputError);

  return (
    <aside
      className={[
        'glass-hud fixed right-3 top-16 z-30 flex flex-col',
        'overflow-hidden rounded-xl border border-zinc-700/60',
        'transition-[width,height] duration-300 ease-in-out',
        'max-w-[calc(100vw-1.5rem)]',
        collapsed
          ? 'h-12 w-48'
          : 'h-[calc(100dvh-5.5rem)] max-h-[850px] w-[22rem]',
      ].join(' ')}
      aria-label="Outpost build and architecture menu"
      data-testid="build-menu"
      data-collapsed={collapsed}
    >
      {/* ==========================================================
          PANEL HEADER
      ========================================================== */}

      <div className="flex min-h-12 shrink-0 items-center justify-between border-b border-zinc-800/80 px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-cyan-500/30 bg-cyan-950/50">
            <Wrench
              className="h-4 w-4 text-cyan-400"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-xs font-black uppercase tracking-widest text-zinc-100">
              {isDesignPhase
                ? 'Engineering Blueprints'
                : 'Station Modules'}
            </h2>

            <p className="font-hud text-[8px] uppercase tracking-widest text-zinc-400">
              {isDesignPhase
                ? `Design Phase · Day ${state.daysPassed}`
                : `Operations · Day ${state.daysPassed}`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((previous) => !previous)}
          className={[
            'ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
            'text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-cyan-300',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
          ].join(' ')}
          aria-label={collapsed ? 'Expand build menu' : 'Collapse build menu'}
          aria-expanded={!collapsed}
          aria-controls="build-menu-content"
        >
          {collapsed ? (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* ==========================================================
          MENU CONTENT
      ========================================================== */}

      {!collapsed && (
        <div
          id="build-menu-content"
          className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden p-3"
        >
          {/* ========================================================
              CONSTRUCTION RESOURCES
          ======================================================== */}

          <section
            className="shrink-0 rounded-lg border border-zinc-800 bg-zinc-950/85 p-2.5 font-hud"
            aria-label="Construction resources and mission forecast"
          >
            <div className="grid grid-cols-2 gap-2">
              {/* Mass */}
              <div className="rounded-md border border-zinc-800/80 bg-zinc-900/60 p-2">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-zinc-500">
                  <Cpu className="h-3 w-3" aria-hidden="true" />
                  Mass Remaining
                </div>

                <p
                  className={`mt-1 text-sm font-bold tabular-nums ${
                    massBudget <= 0 ? 'text-red-400' : 'text-cyan-300'
                  }`}
                >
                  {formatNumber(massBudget)} kg
                </p>
              </div>

              {/* Credits */}
              <div className="rounded-md border border-zinc-800/80 bg-zinc-900/60 p-2">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-zinc-500">
                  <Zap className="h-3 w-3" aria-hidden="true" />
                  Credits
                </div>

                <p
                  className={`mt-1 text-sm font-bold tabular-nums ${
                    creditBudget <= 0 ? 'text-red-400' : 'text-amber-300'
                  }`}
                >
                  {formatNumber(creditBudget)} CR
                </p>
              </div>
            </div>

            {/* Mission forecast */}
            <div
              className={[
                'mt-2 rounded-md border p-2',
                forecast.survives
                  ? 'border-emerald-900/50 bg-emerald-950/20'
                  : 'border-amber-900/50 bg-amber-950/20',
              ].join(' ')}
              aria-live="polite"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] uppercase tracking-wider text-zinc-400">
                  Telemetry Forecast
                </span>

                <strong
                  className={`text-right text-[10px] font-black tabular-nums ${
                    forecast.survives
                      ? 'text-emerald-300'
                      : 'text-amber-300'
                  }`}
                >
                  {forecastText}
                </strong>
              </div>

              <p className="mt-1 text-[9px] leading-relaxed text-zinc-400">
                {forecast.survives
                  ? 'Life-support and power systems are projected to remain balanced for the mission.'
                  : forecast.reason ||
                    'Balance oxygen, power, and water before starting operations.'}
              </p>
            </div>

            {/* Deployment count */}
            <div className="mt-2 flex items-center justify-between border-t border-zinc-800/70 pt-2 text-[9px]">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-zinc-500">
                <Cpu className="h-3 w-3" aria-hidden="true" />
                Deployed Modules
              </span>

              <span className="font-bold tabular-nums text-cyan-300">
                {moduleCount}
              </span>
            </div>
          </section>

          {/* ========================================================
              BLUEPRINT CATALOG
          ======================================================== */}

          <section
            className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1"
            aria-label="Available module blueprints"
            aria-busy="false"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/95 px-1 py-1.5 backdrop-blur-sm">
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                Available Blueprints
              </span>

              <span className="font-hud text-[8px] text-cyan-500">
                {AVAILABLE_MODULES.length} DESIGNS
              </span>
            </div>

            {AVAILABLE_MODULES.map((module) => (
              <BlueprintCard
                key={module.id}
                module={module}
                isDesignPhase={isDesignPhase}
              />
            ))}

            {AVAILABLE_MODULES.length === 0 && (
              <div className="rounded-lg border border-dashed border-zinc-700 p-5 text-center">
                <Cpu className="mx-auto h-7 w-7 text-zinc-600" />

                <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  No Blueprints Available
                </p>

                <p className="mt-1 text-[9px] text-zinc-600">
                  No construction designs are currently registered.
                </p>
              </div>
            )}
          </section>

          {/* ========================================================
              INPUT ERROR
          ======================================================== */}

          {hasInputError && (
            <div
              role="alert"
              className="shrink-0 rounded-md border border-red-900/70 bg-red-950/40 p-2 text-[9px] leading-relaxed text-red-300"
            >
              {state.inputError}
            </div>
          )}

          {/* ========================================================
              DESIGN PHASE ACTIONS
          ======================================================== */}

          {isDesignPhase ? (
            <div className="flex shrink-0 flex-col gap-2 border-t border-zinc-800/80 pt-2">
              <button
                type="button"
                data-testid="start-operations"
                onClick={state.startOperations}
                className={[
                  'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg',
                  'bg-gradient-to-r from-cyan-600 to-cyan-500 px-4',
                  'text-[10px] font-black uppercase tracking-widest text-zinc-950',
                  'shadow-[0_0_20px_rgba(6,182,212,.25)]',
                  'transition-all duration-200 hover:from-cyan-400 hover:to-cyan-300',
                  'active:scale-[0.99]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300',
                ].join(' ')}
              >
                <Play
                  className="h-4 w-4 fill-current"
                  aria-hidden="true"
                />
                Lock Design &amp; Operate
              </button>

              <button
                type="button"
                data-testid="reset-design"
                onClick={() => state.startMission()}
                disabled={moduleCount === 0}
                className={[
                  'inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md border',
                  'border-zinc-700 bg-zinc-900/60 px-3',
                  'text-[9px] font-bold uppercase tracking-wider text-zinc-400',
                  'transition-colors hover:border-zinc-500 hover:text-white',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                  'disabled:cursor-not-allowed disabled:opacity-30',
                ].join(' ')}
              >
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                Reset Architecture
              </button>
            </div>
          ) : (
            <div className="shrink-0 border-t border-zinc-800/80 pt-2 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 font-hud text-[8px] uppercase tracking-widest text-emerald-300">
                <Sparkles
                  className="h-3 w-3"
                  aria-hidden="true"
                />
                Operations Active · Read Only
              </span>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
