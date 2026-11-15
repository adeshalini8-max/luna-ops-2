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
    <footer className="glass-panel z-10 flex flex-none flex-wrap items-center justify-between gap-2 border-x-0 border-b-0 px-3 py-2.5 sm:px-5">
      <div className="flex min-h-11 items-center gap-2">
        <button
          type="button"
          onClick={togglePause}
          aria-label={state.isPaused ? 'Resume simulation' : 'Pause simulation'}
          className={`inline-flex min-h-11 items-center gap-2 rounded px-4 text-[10px] font-black uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
            state.isPaused
              ? 'bg-cyan-600 text-white hover:bg-cyan-500'
              : 'border border-red-800 bg-red-950/60 text-red-200 hover:bg-red-900'
          }`}
        >
          {state.isPaused ? <><Play className="h-4 w-4 fill-current" /> Resume</> : <><Pause className="h-4 w-4 fill-current" /> Pause</>}
        </button>
        <span className="hidden text-[9px] uppercase tracking-widest text-zinc-600 sm:inline">Speed</span>
        {([1, 5] as const).map((speed) => (
          <button
            type="button"
            key={speed}
            aria-pressed={state.tickSpeed === speed}
            onClick={() => setTickSpeed(speed)}
            className={`min-h-10 min-w-10 rounded border px-2 text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              state.tickSpeed === speed ? 'border-cyan-500 text-cyan-300' : 'border-zinc-700 text-zinc-500 hover:text-zinc-200'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-h-10 items-center gap-2 text-[9px] uppercase tracking-wider text-zinc-500">
          Rations
          <select
            aria-label="Ration level"
            value={state.rationLevel}
            onChange={(event) => dispatchAction({
              day: state.daysPassed,
              type: 'set-ration-level',
              payload: { level: Number(event.target.value) },
            })}
            className="min-h-10 rounded border border-zinc-700 bg-zinc-900 px-2 text-[10px] text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <option value="0.6">Emergency</option>
            <option value="1">Standard</option>
            <option value="1.25">Generous</option>
          </select>
        </label>
        {particleWarning && shelterAvailable && (
          <button
            type="button"
            onClick={() => dispatchAction({ day: state.daysPassed, type: 'order-shelter', payload: {} })}
            className="inline-flex min-h-11 items-center gap-2 rounded border border-amber-700 bg-amber-950/50 px-3 text-[10px] font-black uppercase tracking-wider text-amber-200 hover:bg-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <Shield className="h-4 w-4" /> Order shelter
          </button>
        )}
      </div>
      {state.inputError && <p role="alert" className="w-full text-[10px] text-red-300">{state.inputError}</p>}
    </footer>
  );
}