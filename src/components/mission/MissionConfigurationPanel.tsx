import { Globe2, Moon, Sun, Volume2, X } from 'lucide-react';
import type { Mode, Scenario } from '../../engine/types';

interface MissionConfigurationPanelProps {
  scenario: Scenario;
  mode: Mode;
  realSunMode: boolean;
  briefingEnabled: boolean;
  soundEnabled: boolean;
  sunEventCount: number;
  sunDataStatus: string;
  storageWarning: string;
  onScenario: (scenario: Scenario) => void;
  onMode: (mode: Mode) => void;
  onRealSunMode: (enabled: boolean) => void;
  onBriefing: (enabled: boolean) => void;
  onSoundEnabled: (enabled: boolean) => void;
  onClose: () => void;
}

export default function MissionConfigurationPanel({
  scenario,
  mode,
  realSunMode,
  briefingEnabled,
  soundEnabled,
  sunEventCount,
  sunDataStatus,
  storageWarning,
  onScenario,
  onMode,
  onRealSunMode,
  onBriefing,
  onSoundEnabled,
  onClose,
}: MissionConfigurationPanelProps) {
  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="mission-settings-title"
      className="glass-panel fixed inset-x-3 bottom-24 z-50 mx-auto max-h-[calc(100dvh-8rem)] w-auto max-w-md overflow-y-auto rounded-xl border border-cyan-500/40 p-4 shadow-2xl animate-fade-in-up sm:inset-x-auto sm:right-4 sm:mx-0 sm:w-[22rem]"
    >
      <header className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <p className="font-hud text-[9px] uppercase tracking-[0.2em] text-cyan-400">
            Flight systems
          </p>
          <h2
            id="mission-settings-title"
            className="mt-1 text-sm font-black uppercase tracking-wider text-zinc-100"
          >
            Mission Configuration
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close mission settings"
          className="flex h-8 w-8 items-center justify-center rounded border border-zinc-700 text-zinc-400 transition hover:border-zinc-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <fieldset className="mt-4">
        <legend className="mb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
          Destination · environment updates live
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {(['mars', 'moon'] as const).map((world) => (
            <button
              type="button"
              key={world}
              aria-pressed={scenario === world}
              onClick={() => onScenario(world)}
              className={`flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                scenario === world
                  ? world === 'mars'
                    ? 'border-orange-400/80 bg-orange-950/60 text-orange-200'
                    : 'border-sky-300/80 bg-slate-800/80 text-sky-100'
                  : 'border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:border-zinc-600 hover:text-white'
              }`}
            >
              {world === 'mars' ? (
                <Globe2 className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
              {world}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="mb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
          Flight systems
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {(['cadet', 'engineer'] as const).map((level) => (
            <button
              type="button"
              key={level}
              aria-pressed={mode === level}
              onClick={() => onMode(level)}
              className={`min-h-9 rounded-lg border px-3 text-[10px] font-bold uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                mode === level
                  ? 'border-cyan-400/80 bg-cyan-950/60 text-cyan-200'
                  : 'border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:border-zinc-600 hover:text-white'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 space-y-3 border-t border-zinc-800 pt-3">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span>
            <span className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <Sun className="h-3.5 w-3.5 text-amber-400" />
              Real Sun Mode
            </span>
            <span className="mt-0.5 block pl-5 text-[9px] text-zinc-500">
              NASA DONKI SEP · {sunEventCount} records
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-label="Real Sun Mode (NASA DONKI SEP)"
            checked={realSunMode}
            onChange={(event) => onRealSunMode(event.target.checked)}
            className="h-4 w-4 shrink-0 accent-cyan-400"
          />
        </label>

        <label className="flex min-h-8 cursor-pointer items-center justify-between gap-3 text-xs text-zinc-300">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Interactive 90-second briefing
          </span>
          <input
            type="checkbox"
            checked={briefingEnabled}
            onChange={(event) => onBriefing(event.target.checked)}
            className="h-4 w-4 shrink-0 accent-cyan-400"
          />
        </label>

        <label className="flex min-h-8 cursor-pointer items-center justify-between gap-3 text-xs text-zinc-300">
          <span className="flex items-center gap-2">
            <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
            Audio alerts
          </span>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(event) => onSoundEnabled(event.target.checked)}
            className="h-4 w-4 shrink-0 accent-cyan-400"
          />
        </label>
      </div>

      <p role="status" className="mt-3 min-h-7 text-[9px] leading-relaxed text-zinc-500">
        {storageWarning || sunDataStatus}
      </p>
      <p className="text-[9px] leading-relaxed text-zinc-600">
        Environment and HUD update immediately. This run&apos;s scheduled events stay fixed; selected destination, difficulty, and NASA schedule seed the next mission.
      </p>
    </section>
  );
}
