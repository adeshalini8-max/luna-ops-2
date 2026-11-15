import { Bot, Leaf, Stethoscope, Wrench } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import type { MissionState } from '../../engine/types';

interface Advice {
  id: string;
  role: 'Flight engineer' | 'Flight doctor' | 'Botanist';
  icon: typeof Wrench;
  message: string;
  priority: number;
}

function getAdvisorAdvice(state: MissionState): Advice[] {
  const advice: Advice[] = [];
  const solarEventWarning = state.events.some(
    (event) => event.type === 'solar-particle-event' && event.warned,
  );
  const dustStormActive = state.events.some(
    (event) => event.type === 'dust-storm' && event.active,
  );

  if (state.resources.power < 25 || dustStormActive) {
    advice.push({
      id: `${state.daysPassed}-engineer`,
      role: 'Flight engineer',
      icon: Wrench,
      message: dustStormActive
        ? 'Solar output is reduced. Raise reactor priority and conserve non-essential loads.'
        : 'Power reserves are low. Keep life support above greenhouse and comfort loads.',
      priority: 1,
    });
  }
  if (solarEventWarning || state.resources.radiationDose >= state.resourceCaps.radiationDose * 0.6) {
    advice.push({
      id: `${state.daysPassed}-doctor`,
      role: 'Flight doctor',
      icon: Stethoscope,
      message: solarEventWarning
        ? 'Particle-event warning received. I recommend shelter now, even if it competes with power conservation.'
        : 'Cumulative radiation is rising. Avoid unnecessary exposure and review shielding.',
      priority: solarEventWarning ? 0 : 2,
    });
  }
  if (state.resources.food < 25 || state.resources.water < 25) {
    advice.push({
      id: `${state.daysPassed}-botanist`,
      role: 'Botanist',
      icon: Leaf,
      message:
        state.resources.water < 25
          ? 'Crop growth depends on water. Protect the recycler before expanding greenhouse output.'
          : 'Food reserve is falling. Keep the greenhouse online and consider emergency rations.',
      priority: 3,
    });
  }

  return advice
    .sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id))
    .slice(0, 2);
}

export default function AdvisorChat() {
  const state = useGameStore();
  const advice = getAdvisorAdvice(state);
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-950/75 p-3" aria-labelledby="advisor-heading">
      <div className="mb-2 flex items-center justify-between">
        <h2 id="advisor-heading" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-400"><Bot className="h-3.5 w-3.5 text-cyan-300" /> Mission advisors</h2>
        <span className="text-[8px] uppercase tracking-widest text-zinc-600">Max 2 / day</span>
      </div>
      {advice.length ? (
        <div className="grid gap-2 md:grid-cols-2">
          {advice.map((entry) => {
            const Icon = entry.icon;
            return (
              <article key={entry.id} className="rounded border border-zinc-800 bg-zinc-900/80 p-2.5">
                <h3 className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300"><Icon className="h-3.5 w-3.5" />{entry.role}</h3>
                <p className="mt-1 text-[10px] leading-relaxed text-zinc-300">{entry.message}</p>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="text-[10px] text-zinc-500">All advisor channels clear. Guidance appears only when conditions warrant action.</p>
      )}
    </section>
  );
}