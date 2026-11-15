import { AlertTriangle, ArrowDown, ArrowUp, CircleHelp } from 'lucide-react';
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import ModuleNode from './ModuleNode';

export default function Grid() {
  const state = useGameStore();
  const dispatchAction = useGameStore((game) => game.dispatchAction);
  const [selectedId, setSelectedId] = useState('');
  const selected = state.builtModules.find((module) => module.id === selectedId);
  const columns = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(state.builtModules.length))));

  function repair(moduleId: string) {
    dispatchAction({
      day: state.daysPassed,
      type: 'repair-module',
      payload: { moduleId },
    });
  }

  return (
    <div>
      {state.builtModules.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 p-8 text-center">
          <AlertTriangle className="h-7 w-7 text-amber-400" />
          <p className="mt-3 text-sm font-bold">No systems deployed</p>
          <p className="mt-1 max-w-xs text-xs text-zinc-500">The crew is consuming supplies. This is a controlled failure scenario.</p>
        </div>
      ) : (
        <div
          className="grid content-start gap-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {state.builtModules.map((module) => (
            <ModuleNode
              key={module.id}
              module={module}
              day={state.daysPassed}
              selected={selectedId === module.id}
              onSelect={() => setSelectedId((id) => id === module.id ? '' : module.id)}
              onRepair={(module.offlineUntilDay ?? 0) > state.daysPassed
                ? () => repair(module.id)
                : undefined}
            />
          ))}
        </div>
      )}
      {selected && (
        <section className="mt-3 rounded border border-zinc-700 bg-zinc-900/95 p-3" aria-label={`${selected.name} controls`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <CircleHelp className="mt-0.5 h-4 w-4 flex-none text-cyan-300" />
              <div>
                <h3 className="text-xs font-bold">{selected.name} · priority {selected.powerPriority}</h3>
                <p className="mt-1 max-w-xl text-[10px] leading-relaxed text-zinc-400">{selected.scientificNote}</p>
              </div>
            </div>
            <button type="button" onClick={() => setSelectedId('')} aria-label="Close module controls" className="min-h-9 min-w-9 rounded text-zinc-400 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">×</button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500">Power priority</span>
            <button
              type="button"
              aria-label={`Increase ${selected.name} priority`}
              onClick={() => dispatchAction({ day: state.daysPassed, type: 'set-power-priority', payload: { moduleId: selected.id, priority: selected.powerPriority + 1 } })}
              className="min-h-10 min-w-10 rounded border border-zinc-700 hover:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            ><ArrowUp className="mx-auto h-4 w-4" /></button>
            <span className="font-hud text-xs">{selected.powerPriority}</span>
            <button
              type="button"
              aria-label={`Decrease ${selected.name} priority`}
              disabled={selected.powerPriority === 0}
              onClick={() => dispatchAction({ day: state.daysPassed, type: 'set-power-priority', payload: { moduleId: selected.id, priority: Math.max(0, selected.powerPriority - 1) } })}
              className="min-h-10 min-w-10 rounded border border-zinc-700 hover:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-40"
            ><ArrowDown className="mx-auto h-4 w-4" /></button>
          </div>
        </section>
      )}
    </div>
  );
}