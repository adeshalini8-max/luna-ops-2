import { Pause, Play, Shield } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

export default function TimeControls() {
  const state = useGameStore();
  const togglePause = useGameStore((game) => game.togglePause);
  const setTickSpeed = useGameStore((game) => game.setTickSpeed);
  const dispatchAction = useGameStore((game) => game.dispatchAction);

  const particleWarning = state.events.some(
    (event) => event.type === 'solar-particle-event' && event.warned,
  );
  const shelterAvailable = state.builtModules.some(
    (module) => module.moduleType === 'storm_shelter',
  );

  return (
    <footer className="glass-hud fixed bottom-0 left-0 right-0 z-40 flex flex-wrap items-center justify-between gap-3 border-x-0 border-b-0 px-3 py-2 sm:px-6">
      {/* Simulation Playback & Speed Controls */}
      <div className="flex min-h-10 items-center gap-2">
        <button
          type="button"
          onClick={togglePause}
          aria-label={state.isPaused ? 'Resume simulation' : 'Pause simulation'}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-4 text-[10px] font-black uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 shadow-md ${
            state.isPaused
              ? 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'border border-red-700 bg-red-950/80 text-red-200 hover:bg-red-900'
          }`}
        >
          {state.isPaused ? (
            <>
              <Play className="h-3.5 w-3.5 fill-current" /> Resume
            </>
          ) : (
            <>
              <Pause className="h-3.5 w-3.5 fill-current" /> Pause
            </>
          )}
        </button>

        <span className="hidden text-[9px] uppercase tracking-widest text-zinc-500 sm:inline ml-2">
          Time Warp:
        </span>
        {([1, 5] as const).map((speed) => (
          <button
            type="button"
            key={speed}
            aria-pressed={state.tickSpeed === speed}
            onClick={() => setTickSpeed(speed)}
            className={`min-h-8 min-w-8 rounded border px-2 text-[10px] font-hud font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              state.tickSpeed === speed
                ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'border-zinc-800 bg-zinc-950/60 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>

      {/* Rations & Emergency Shelter Commands */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-h-8 items-center gap-2 text-[9px] uppercase tracking-wider text-zinc-400">
          Crew Rations:
          <select
            aria-label="Ration level"
            value={state.rationLevel}
            onChange={(event) =>
              dispatchAction({
                day: state.daysPassed,
                type: 'set-ration-level',
                payload: { level: Number(event.target.value) },
              })
            }
            className="min-h-8 rounded border border-zinc-700 bg-zinc-900/90 px-2 text-[10px] text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <option value="0.6">Emergency (60%)</option>
            <option value="1">Standard (100%)</option>
            <option value="1.25">Generous (125%)</option>
          </select>
        </label>

        {particleWarning && shelterAvailable && (
          <button
            type="button"
            onClick={() =>
              dispatchAction({ day: state.daysPassed, type: 'order-shelter', payload: {} })
            }
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-amber-500 bg-amber-950 px-3 text-[10px] font-black uppercase tracking-wider text-amber-200 hover:bg-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse"
          >
            <Shield className="h-4 w-4" /> Order Shelter
          </button>
        )}
      </div>

      {state.inputError && (
        <p role="alert" className="w-full text-center text-[10px] text-red-300">
          {state.inputError}
        </p>
      )}
    </footer>
  );
}
