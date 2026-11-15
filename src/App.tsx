import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Globe2,
  Moon,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Sun,
  Wrench,
} from 'lucide-react';
import { MISSION_DURATION_DAYS } from './engine/constants';
import { createReplayPayload, decodeReplayPayload, encodeReplayPayload } from './engine/share';
import { forecastMission } from './engine/loop';
import { loadSunEventsFromDonki } from './services/nasaDonki';
import { useGameStore, AVAILABLE_MODULES } from './store/gameStore';
import ResourceBar from './components/hud/ResourceBar';
import TimeControls from './components/hud/TimeControls';
import Grid from './components/base/Grid';
import ResourceFlow from './components/base/ResourceFlow';
import AdvisorChat from './components/overlays/AdvisorChat';
import {
  loadBestRun,
  loadLocalSettings,
  saveBestRun,
  saveLocalSettings,
} from './storage/localData';
import type { LocalSettings } from './storage/localData';
import type {
  Action,
  CauseLog,
  Mode,
  OutpostModule,
  Scenario,
} from './engine/types';

const REPLAY_QUERY = 'share';

function isCriticalLog(log: string) {
  return log.includes('CRITICAL') || log.includes('WARNING') || log.includes('STARVED');
}

function formatResource(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function PhaseBadge({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded border border-cyan-900/70 bg-cyan-950/40 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-cyan-300">{children}</span>;
}

function PrimaryButton({
  children,
  onClick,
  disabled = false,
  testId,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  testId?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-cyan-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function TitleScreen() {
  const goToSelect = useGameStore((state) => state.goToSelect);
  const best = loadBestRun();
  return (
    <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
      <section className="glass-panel w-full max-w-4xl overflow-hidden rounded-2xl">
        <div className="grid md:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 sm:p-10">
            <PhaseBadge><Radio className="h-3 w-3" /> Mission Control · Training Sim</PhaseBadge>
            <h2 className="mt-5 text-3xl font-black uppercase leading-tight tracking-[0.12em] sm:text-5xl">
              Build a base.<br /><span className="text-cyan-300">Keep them alive.</span>
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-400">
              Design a four-person lunar or Martian outpost. Balance power, oxygen, water, food and radiation through thirty mission days.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <PrimaryButton onClick={goToSelect} testId="start-mission">
                Start mission <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <Clock3 className="h-4 w-4" /> ~5 min mission · deterministic
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between border-t border-zinc-800 bg-black/20 p-6 md:border-l md:border-t-0 sm:p-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Mission parameters</p>
              <ul className="mt-4 space-y-3 text-xs text-zinc-300">
                <li className="flex gap-2"><Check className="h-4 w-4 flex-none text-emerald-400" /> Every system has trade-offs.</li>
                <li className="flex gap-2"><Check className="h-4 w-4 flex-none text-emerald-400" /> Weather and failures are seeded.</li>
                <li className="flex gap-2"><Check className="h-4 w-4 flex-none text-emerald-400" /> Debrief traces causes, not just symptoms.</li>
              </ul>
            </div>
            <div className="mt-8 rounded border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-[9px] uppercase tracking-widest text-zinc-600">Best local run</p>
              <p className="mt-1 font-hud text-lg font-bold text-cyan-300">
                {best ? `${best.days} DAYS · ${best.score} PTS` : 'No missions recorded'}
              </p>
              <p className="text-[10px] text-zinc-500">Stored on this device only</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SelectionScreen({
  onScenario,
  onMode,
  onRealSunMode,
  onSoundEnabled,
  soundEnabled,
  storageWarning,
  sunDataStatus,
}: {
  onScenario: (scenario: Scenario) => void;
  onMode: (mode: Mode) => void;
  onRealSunMode: (enabled: boolean) => void;
  onSoundEnabled: (enabled: boolean) => void;
  soundEnabled: boolean;
  storageWarning: string;
  sunDataStatus: string;
}) {
  const scenario = useGameStore((state) => state.selectedScenario);
  const mode = useGameStore((state) => state.selectedMode);
  const enterTutorial = useGameStore((state) => state.enterTutorial);
  const startMission = useGameStore((state) => state.startMission);
  const realSunMode = useGameStore((state) => state.realSunMode);
  const sunEventCount = useGameStore((state) => state.sunEvents.length);
  const [tutorialEnabled, setTutorialEnabled] = useState(true);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl items-center justify-center p-4 sm:p-8">
      <section className="glass-panel w-full rounded-xl p-5 sm:p-8">
        <PhaseBadge><Globe2 className="h-3 w-3" /> Mission configuration</PhaseBadge>
        <h2 className="mt-4 text-2xl font-black uppercase tracking-widest">Choose your outpost</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <fieldset>
            <legend className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Destination</legend>
            <div className="grid grid-cols-2 gap-3">
              {(['mars', 'moon'] as const).map((world) => (
                <button
                  type="button"
                  key={world}
                  aria-pressed={scenario === world}
                  onClick={() => onScenario(world)}
                  className={`min-h-24 rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${scenario === world ? 'border-cyan-500 bg-cyan-950/50' : 'border-zinc-700 bg-zinc-900/60 hover:border-zinc-500'}`}
                >
                  <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">{world === 'mars' ? <Globe2 className="h-4 w-4 text-orange-300" /> : <Moon className="h-4 w-4 text-sky-300" />}{world}</span>
                  <span className="mt-2 block text-[10px] leading-relaxed text-zinc-500">{world === 'mars' ? 'Dust storms, delayed comms, solar variability.' : 'Long lunar nights, stored-power challenge.'}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Difficulty / detail</legend>
            <div className="grid grid-cols-2 gap-3">
              {(['cadet', 'engineer'] as const).map((level) => (
                <button
                  type="button"
                  key={level}
                  aria-pressed={mode === level}
                  onClick={() => onMode(level)}
                  className={`min-h-24 rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${mode === level ? 'border-cyan-500 bg-cyan-950/50' : 'border-zinc-700 bg-zinc-900/60 hover:border-zinc-500'}`}
                >
                  <span className="text-sm font-bold uppercase tracking-wider">{level}</span>
                  <span className="mt-2 block text-[10px] leading-relaxed text-zinc-500">{level === 'cadet' ? 'Plain-language gauges and guidance.' : 'Full systems data and live controls.'}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded border border-zinc-800 bg-zinc-950/50 p-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold"><Sun className="h-4 w-4 text-amber-300" /> Real Sun Mode</p>
            <p className="mt-1 text-[10px] text-zinc-500">
              Replay historical NASA DONKI SEP records as training scenarios. {sunEventCount} records available. {sunDataStatus}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={realSunMode}
            onClick={() => onRealSunMode(!realSunMode)}
            className={`relative h-8 w-14 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${realSunMode ? 'border-cyan-500 bg-cyan-950' : 'border-zinc-700 bg-zinc-800'}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full transition-all ${realSunMode ? 'left-7 bg-cyan-300' : 'left-1 bg-zinc-400'}`} />
            <span className="sr-only">Toggle Real Sun Mode</span>
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex min-h-11 items-center gap-3 text-xs text-zinc-400">
            <input type="checkbox" checked={tutorialEnabled} onChange={(event) => setTutorialEnabled(event.target.checked)} className="h-4 w-4 accent-cyan-500" />
            Include interactive 90-second briefing
          </label>
          <label className="flex min-h-11 items-center gap-2 text-xs text-zinc-400">
            <input type="checkbox" checked={soundEnabled} onChange={(event) => onSoundEnabled(event.target.checked)} className="h-4 w-4 accent-cyan-500" />
            Sound alerts
          </label>
        </div>
        {storageWarning && <p role="status" className="mt-2 text-[10px] text-amber-300">{storageWarning}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={() => setTutorialEnabled(true)} className="min-h-11 rounded px-4 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">Reset briefing</button>
          <PrimaryButton onClick={() => (tutorialEnabled ? enterTutorial() : startMission())} testId="continue-selection">
            Continue <ChevronRight className="h-4 w-4" />
          </PrimaryButton>
        </div>
      </section>
    </div>
  );
}

const TUTORIAL_QUESTIONS = [
  {
    prompt: 'A power shortage is coming. Which system should keep its power priority?',
    options: ['Life-support oxygen systems', 'Decorative lighting'],
    answer: 0,
    explanation: 'Life support takes priority over non-essential loads.',
  },
  {
    prompt: 'A lunar outpost has two weeks without sunlight. What closes the gap?',
    options: ['More solar panels alone', 'A reactor and stored power'],
    answer: 1,
    explanation: 'Solar arrays cannot generate during lunar night; firm generation and storage help bridge it.',
  },
  {
    prompt: 'A particle-event warning arrives. What should the crew do?',
    options: ['Order the crew into the shelter', 'Wait until the event ends'],
    answer: 0,
    explanation: 'The warning window is an actionable time to move to protected shelter.',
  },
];

function TutorialScreen({ onTutorialSeen }: { onTutorialSeen: () => void }) {
  const finishTutorial = useGameStore((state) => state.finishTutorial);
  const skipTutorial = useGameStore((state) => state.skipTutorial);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const question = TUTORIAL_QUESTIONS[questionIndex];

  function answer(index: number) {
    if (index === question.answer) {
      setFeedback(question.explanation);
      window.setTimeout(() => {
        if (questionIndex === TUTORIAL_QUESTIONS.length - 1) {
          onTutorialSeen();
          finishTutorial();
        } else {
          setQuestionIndex((current) => current + 1);
          setFeedback('');
        }
      }, 500);
    } else {
      setFeedback('Not quite. Consider what protects the crew first.');
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl items-center justify-center p-4 sm:p-8">
      <section className="glass-panel w-full rounded-xl p-5 sm:p-8">
        <PhaseBadge><BookOpen className="h-3 w-3" /> Flight systems briefing · {questionIndex + 1} of {TUTORIAL_QUESTIONS.length}</PhaseBadge>
        <div className="mt-5 h-1 overflow-hidden rounded bg-zinc-800"><div className="h-full bg-cyan-400 transition-all" style={{ width: `${((questionIndex + 1) / TUTORIAL_QUESTIONS.length) * 100}%` }} /></div>
        <h2 className="mt-6 text-xl font-black uppercase tracking-wider">Mission survival is a systems problem</h2>
        <p className="mt-4 rounded border border-zinc-800 bg-zinc-950/60 p-4 text-sm leading-relaxed text-zinc-200">{question.prompt}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {question.options.map((option, index) => (
            <button type="button" key={option} onClick={() => answer(index)} className="min-h-14 rounded border border-zinc-700 bg-zinc-900 px-4 py-3 text-left text-xs font-bold text-zinc-200 hover:border-cyan-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">{option}</button>
          ))}
        </div>
        <p aria-live="polite" className={`mt-4 min-h-6 text-xs ${feedback.startsWith('Not') ? 'text-amber-300' : 'text-emerald-300'}`}>{feedback}</p>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={() => { onTutorialSeen(); skipTutorial(); }} className="min-h-11 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">Skip briefing</button>
        </div>
      </section>
    </div>
  );
}

function BuildCard({ module }: { module: OutpostModule }) {
  const buildModule = useGameStore((state) => state.buildModule);
  const resources = useGameStore((state) => state.resources);
  const alreadyBuilt = useGameStore((state) => state.builtModules.filter((item) => item.moduleType === module.moduleType).length);
  const affordable = resources.massBudget >= module.mass && resources.creditBudget >= module.costCredits;
  return (
    <article className="rounded-lg border border-zinc-800 bg-zinc-900/75 p-3 transition hover:border-zinc-600">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-zinc-100">{module.name}</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">{module.description}</p>
        </div>
        <details className="relative flex-none">
          <summary
            title={`Why ${module.name}?`}
            aria-label={`Scientific note for ${module.name}`}
            className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <CircleHelp className="h-4 w-4" />
          </summary>
          <p className="absolute right-0 top-10 z-20 w-64 rounded border border-cyan-900 bg-zinc-950 p-3 text-[10px] leading-relaxed text-zinc-300 shadow-xl">
            {module.scientificNote}
          </p>
        </details>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="font-hud text-[9px] text-zinc-500">MASS {module.mass} · CR {module.costCredits}{alreadyBuilt ? ` · ×${alreadyBuilt}` : ''}</span>
        <button
          type="button"
          onClick={() => buildModule(module.id)}
          disabled={!affordable}
          aria-label={`Deploy ${module.name}`}
          className="inline-flex min-h-10 items-center gap-1 rounded border border-zinc-700 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-200 hover:border-cyan-600 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-35"
        ><Plus className="h-3.5 w-3.5" /> Deploy</button>
      </div>
    </article>
  );
}

function DesignScreen() {
  const state = useGameStore();
  const forecast = forecastMission(state);
  const forecastText = forecast.survives ? '30+ days projected' : `${forecast.days} days projected`;

  return (
    <div className="mx-auto w-full max-w-7xl p-3 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><PhaseBadge><Wrench className="h-3 w-3" /> Design phase · Day 0</PhaseBadge><h2 className="mt-2 text-xl font-black uppercase tracking-widest">Build your outpost</h2><p className="mt-1 text-xs text-zinc-500">Construction is limited by mass and credit budgets. No cost-free modules.</p></div>
        <div className="grid grid-cols-2 gap-2 font-hud text-[10px]">
          <div className="rounded border border-zinc-800 bg-zinc-900 px-3 py-2"><span className="text-zinc-500">MASS</span><strong className="ml-2 text-zinc-200">{formatResource(state.resources.massBudget)} kg</strong></div>
          <div className="rounded border border-zinc-800 bg-zinc-900 px-3 py-2"><span className="text-zinc-500">CREDITS</span><strong className="ml-2 text-zinc-200">{formatResource(state.resources.creditBudget)}</strong></div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid content-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {AVAILABLE_MODULES.map((module) => <BuildCard key={module.id} module={module} />)}
        </div>
        <aside className="flex flex-col gap-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Live survival forecast</p>
            <p className={`mt-2 text-2xl font-black ${forecast.survives ? 'text-emerald-300' : 'text-amber-300'}`}>{forecastText}</p>
            <p className="mt-2 text-[10px] leading-relaxed text-zinc-500">
              {forecast.survives ? 'Current design survives the objective in the seeded forecast.' : forecast.reason || 'Deploy life support and generation before the crew begins consuming supplies.'}
            </p>
            <p className="mt-3 border-t border-zinc-800 pt-3 text-[9px] text-zinc-600">Forecast runs the deterministic engine on a separate copy of this design.</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Deployed systems</p>
            <div className="mt-2 space-y-1.5">
              {state.builtModules.length === 0 ? <p className="text-xs text-zinc-600">None yet.</p> : state.builtModules.map((module) => <div key={module.id} className="flex justify-between gap-2 text-[10px]"><span className="text-zinc-300">{module.name}</span><span className="text-zinc-600">{module.mass} kg</span></div>)}
            </div>
          </div>
          {state.inputError && <p role="alert" className="rounded border border-red-900 bg-red-950/40 p-3 text-xs text-red-300">{state.inputError}</p>}
          <PrimaryButton onClick={state.startOperations} testId="start-operations"><Play className="h-4 w-4 fill-current" /> Lock design & operate</PrimaryButton>
        </aside>
      </div>
    </div>
  );
}

function CommsPanel() {
  const logs = useGameStore((state) => state.logs);
  const visibleLogs = logs.slice(-60).reverse();
  return (
    <aside className="flex max-h-40 flex-none flex-col border-b border-zinc-800 bg-zinc-950/90 p-3 backdrop-blur-md md:max-h-none md:w-56 md:border-b-0 md:border-r xl:w-64">
      <div className="mb-2 flex items-center justify-between"><div><h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Comms link</h2><p className="mt-1 text-[9px] uppercase tracking-widest text-zinc-600">Mission log · live</p></div><span className="h-2 w-2 rounded-full bg-emerald-500" /></div>
      <div className="min-h-14 flex-1 space-y-1 overflow-y-auto rounded border border-zinc-800 bg-black/40 p-1.5 font-hud text-[9px]" aria-live="polite">
        {visibleLogs.map((log, index) => <div key={`${logs.length - index}-${log}`} className={`rounded px-2 py-1.5 leading-relaxed ${isCriticalLog(log) ? 'border border-red-900/70 bg-red-950/50 text-red-300' : log.includes('EVENT') || log.includes('WARNING') ? 'border border-amber-900/50 bg-amber-950/20 text-amber-300' : log.includes('DEPLOYED') ? 'text-cyan-300' : 'border-b border-zinc-800/60 text-zinc-400'}`}>{log}</div>)}
      </div>
      <p className="mt-2 text-right text-[9px] text-zinc-600">{logs.length} transmissions</p>
    </aside>
  );
}

function EventBanner() {
  const events = useGameStore((state) => state.activeEvents);
  if (!events.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {events.map((event) => <div key={event.id} role="status" className="flex items-center gap-2 rounded border border-amber-800/70 bg-amber-950/40 px-3 py-2 text-[10px] font-bold text-amber-200">
        <AlertTriangle className="h-4 w-4" />
        <span>{event.warned ? 'WARNING' : 'ACTIVE'}: {event.name}{event.sourceDate ? ` · ${event.sourceDate} · ${event.eventClass}` : ''}</span>
      </div>)}
    </div>
  );
}

function OperationsControls() {
  return <TimeControls />;
}
function OperationsScreen() {
  const state = useGameStore();
  const eventWarning = state.activeEvents.some((event) => event.warned);
  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <CommsPanel />
      <section
        className="relative min-h-0 min-w-0 flex-1 overflow-y-auto p-3 sm:p-5"
        aria-label="Outpost operations grid"
        style={{
          backgroundImage: 'linear-gradient(rgba(63, 63, 70, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(63, 63, 70, 0.12) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      >
        <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-3">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <div>
              <PhaseBadge><Activity className="h-3 w-3" /> Operations · {state.scenario}</PhaseBadge>
              <h2 className="mt-2 text-lg font-black uppercase tracking-widest">Surface systems</h2>
            </div>
            <EventBanner />
          </div>
          {eventWarning && (
            <p className="rounded border border-amber-900 bg-amber-950/30 p-2 text-[10px] text-amber-200">
              Critical event warning: simulation auto-paused. Review the event and choose an action before resuming.
            </p>
          )}
          <Grid />
          <ResourceFlow />
          <AdvisorChat />
        </div>
      </section>
    </div>
  );
}
function causeChain(causes: CauseLog[]) {
  const failure = causes.findLast((cause) => cause.system === 'mission');
  if (!failure) return [];
  const byId = new Map(causes.map((cause) => [cause.id, cause]));
  const chain: CauseLog[] = [];
  let current: CauseLog | undefined = failure;
  while (current && !chain.some((cause) => cause.id === current?.id)) {
    chain.push(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return chain.reverse();
}

function calculateScore() {
  const state = useGameStore.getState();
  const survival = (state.daysPassed / MISSION_DURATION_DAYS) * 60;
  const safety = Math.max(0, Math.min(state.resources.oxygen / 120, state.resources.power / state.resourceCaps.power, state.resources.water / 120, state.resources.food / 120, 1 - state.resources.radiationDose / state.resourceCaps.radiationDose)) * 25;
  const usedMass = state.resourceCaps.massBudget - state.resources.massBudget;
  const efficiency = Math.max(0, 15 * (1 - usedMass / state.resourceCaps.massBudget));
  const score = Math.round(survival + safety + efficiency);
  return { score, grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 65 ? 'C' : score >= 50 ? 'D' : 'E' };
}

function MissionReport({ success }: { success: boolean }) {
  const state = useGameStore();
  const retry = useGameStore((game) => game.restartMission);
  const setInputError = useGameStore((game) => game.setInputError);
  const [shareLink, setShareLink] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const score = calculateScore();
  const chain = causeChain(state.causeLog);
  const actions: Action[] = state.actionLog.filter((entry) => entry.status === 'applied').map((entry) => entry.action);

  useEffect(() => {
    const warning = saveBestRun({ days: state.daysPassed, score: score.score });
    if (warning) setInputError(warning);
  }, [score.score, setInputError, state.daysPassed]);

  async function shareRun() {
    const payload = createReplayPayload(state.seed, state.scenario, state.mode, actions, {
      sunEvents: state.realSunMode ? state.missionSunEvents : undefined,
      realSunMode: state.realSunMode,
    });
    const url = new URL(window.location.href);
    url.searchParams.set(REPLAY_QUERY, encodeReplayPayload(payload));
    setShareLink(url.toString());
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopyMessage('Replay link copied to clipboard.');
    } catch {
      setCopyMessage('Copy the replay link below.');
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl items-center justify-center p-4 sm:p-8">
      <section className="glass-panel w-full overflow-hidden rounded-xl">
        <div className={`border-b p-5 sm:p-7 ${success ? 'border-emerald-900 bg-emerald-950/30' : 'border-red-900 bg-red-950/30'}`}>
          <PhaseBadge>{success ? 'Mission complete' : 'Mission terminated'} · Day {state.daysPassed}</PhaseBadge>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-widest">{success ? 'Outpost sustained' : 'Mission debrief'}</h2>
          <p className="mt-2 text-sm text-zinc-300">{success ? 'The crew completed the 30-day mission.' : state.debriefReason}</p>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-[0.8fr_1.2fr] sm:p-7">
          <div>
            {success && <div className="rounded-lg border border-zinc-700 bg-zinc-950/70 p-4 text-center"><p className="text-[9px] uppercase tracking-widest text-zinc-500">Mission score · grade</p><p className="mt-2 text-4xl font-black text-cyan-300">{score.score} <span className="text-2xl">{score.grade}</span></p></div>}
            <h3 className="mt-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Root cause timeline</h3>
            <ol className="mt-3 space-y-2 border-l border-zinc-700 pl-4">
              {chain.length > 0 ? chain.map((cause) => <li key={cause.id} className="relative text-[10px] leading-relaxed text-zinc-300"><span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border border-zinc-950 bg-amber-400" /><span className="font-hud text-cyan-300">Day {cause.day} · {cause.system}</span><br />{cause.reason}</li>) : <li className="text-xs text-zinc-500">No failure chain. Review the daily comms log.</li>}
            </ol>
            {!success && <div className="mt-4 rounded border border-cyan-900 bg-cyan-950/30 p-3"><p className="text-[9px] font-bold uppercase tracking-widest text-cyan-300">What might have saved the mission?</p><p className="mt-1 text-[10px] leading-relaxed text-zinc-300">{chain.some((cause) => cause.system === 'power') ? 'Add redundant power generation or battery storage before starting the lunar night or dust-storm window.' : chain.some((cause) => cause.system === 'radiationDose') ? 'Deploy regolith shielding and order the crew into the storm shelter when the warning arrives.' : 'Increase the relevant life-support reserve and add a production/recycling module before operations.'}</p></div>}
            <div className="mt-4 rounded border border-zinc-800 bg-zinc-950/60 p-3"><p className="text-[9px] uppercase tracking-widest text-zinc-500">Reflection</p><p className="mt-1 text-[11px] text-zinc-300">Which system would you redesign first, and what would that choice cost?</p></div>
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Complete mission timeline</h3>
            <div className="mt-3 max-h-72 space-y-1 overflow-y-auto rounded border border-zinc-800 bg-black/30 p-2 font-hud text-[9px]">
              {state.logs.map((log, index) => <p key={`${index}-${log}`} className={`border-b border-zinc-800/70 py-1 ${isCriticalLog(log) ? 'text-red-300' : log.includes('EVENT') ? 'text-amber-300' : 'text-zinc-400'}`}>{log}</p>)}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 p-4 sm:px-7">
          <div className="flex flex-wrap gap-2">
            <PrimaryButton onClick={retry}><RefreshCw className="h-4 w-4" /> Retry mission</PrimaryButton>
            <button type="button" onClick={shareRun} className="min-h-11 rounded border border-zinc-700 px-4 text-[10px] font-bold uppercase tracking-wider text-zinc-200 hover:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">Share replay</button>
          </div>
          <p aria-live="polite" className="text-[10px] text-zinc-400">{copyMessage || state.inputError}</p>
          {shareLink && <input aria-label="Replay link" readOnly value={shareLink} onFocus={(event) => event.currentTarget.select()} className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-[10px] text-cyan-200" />}
        </div>
      </section>
    </div>
  );
}

function App() {
  const appPhase = useGameStore((state) => state.appPhase);
  const isPaused = useGameStore((state) => state.isPaused);
  const tickSpeed = useGameStore((state) => state.tickSpeed);
  const gameOver = useGameStore((state) => state.gameOver);
  const tick = useGameStore((state) => state.tick);
  const loadReplay = useGameStore((state) => state.loadReplay);
  const setInputError = useGameStore((state) => state.setInputError);
  const inputError = useGameStore((state) => state.inputError);
  const chooseScenario = useGameStore((state) => state.chooseScenario);
  const chooseMode = useGameStore((state) => state.chooseMode);
  const setRealSunMode = useGameStore((state) => state.setRealSunMode);
  const realSunMode = useGameStore((state) => state.realSunMode);
  const togglePause = useGameStore((state) => state.togglePause);
  const setSunEvents = useGameStore((state) => state.setSunEvents);
  const [localSettingsState, setLocalSettingsState] = useState(loadLocalSettings);
  const [sunDataStatus, setSunDataStatus] = useState('Bundled archive ready; NASA refresh runs when Real Sun Mode is enabled.');
  const [demoMode] = useState(() => new URLSearchParams(window.location.search).get('demo') === '1');
  const preferencesInitialized = useRef(false);
  const replayHandled = useRef(false);
  const previousAlarmTokens = useRef('');
  const audioContext = useRef<AudioContext | null>(null);
  const alertTokens = useGameStore((state) =>
    state.activeEvents
      .filter((event) => event.warned || event.active)
      .map((event) => `${event.id}:${event.warned ? 'warning' : 'active'}`)
      .join('|'),
  );

  useEffect(() => {
    if (appPhase !== 'operate' || isPaused || gameOver) return undefined;
    const interval = tickSpeed === 5 ? 300 : 1500;
    const timer = window.setInterval(tick, interval);
    return () => window.clearInterval(timer);
  }, [appPhase, gameOver, isPaused, tick, tickSpeed]);

  useEffect(() => {
    if (!demoMode || appPhase !== 'operate' || !isPaused || gameOver) return undefined;
    const timer = window.setTimeout(togglePause, 400);
    return () => window.clearTimeout(timer);
  }, [appPhase, demoMode, gameOver, isPaused, togglePause]);

  useEffect(() => {
    if (preferencesInitialized.current) return;
    preferencesInitialized.current = true;
    chooseScenario(localSettingsState.settings.scenario);
    chooseMode(localSettingsState.settings.mode);
    setRealSunMode(localSettingsState.settings.realSunMode);
  }, [chooseMode, chooseScenario, localSettingsState.settings, setRealSunMode]);

  useEffect(() => {
    if (!realSunMode) return undefined;
    let active = true;
    void loadSunEventsFromDonki().then((result) => {
      if (!active) return;
      setSunEvents(result.events);
      setSunDataStatus(
        result.warning ||
          `Loaded ${result.events.length} recent records from NASA DONKI.`,
      );
    }).catch((error: unknown) => {
      if (!active) return;
      const message = error instanceof Error ? error.message : 'Unexpected DONKI loading error.';
      setSunDataStatus(`NASA DONKI refresh failed: ${message}. Using the bundled archive.`);
    });
    return () => {
      active = false;
    };
  }, [realSunMode, setSunEvents]);

  useEffect(() => {
    if (!alertTokens) {
      previousAlarmTokens.current = '';
      return;
    }
    if (alertTokens === previousAlarmTokens.current) return;
    previousAlarmTokens.current = alertTokens;
    if (!localSettingsState.settings.soundEnabled) return;

    try {
      if (!audioContext.current) audioContext.current = new window.AudioContext();
      const context = audioContext.current;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startAt = context.currentTime;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(740, startAt);
      oscillator.frequency.setValueAtTime(520, startAt + 0.12);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.08, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.32);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.33);
      void context.resume().catch(() => {
        setInputError('Sound alert playback was blocked by the browser. Enable sound from the mission settings after interacting with the page.');
      });
    } catch (error) {
      setInputError(error instanceof Error ? `Sound alert unavailable: ${error.message}` : 'Sound alert unavailable.');
    }
  }, [alertTokens, localSettingsState.settings.soundEnabled, setInputError]);

  useEffect(
    () => () => {
      if (audioContext.current && audioContext.current.state !== 'closed') {
        void audioContext.current.close();
      }
    },
    [],
  );

  function updateLocalSettings(patch: Partial<LocalSettings>) {
    const settings = { ...localSettingsState.settings, ...patch };
    const warning = saveLocalSettings(settings);
    setLocalSettingsState({ settings, warning });
  }

  function updateScenario(scenario: Scenario) {
    chooseScenario(scenario);
    updateLocalSettings({ scenario });
  }

  function updateMode(mode: Mode) {
    chooseMode(mode);
    updateLocalSettings({ mode });
  }

  function updateRealSunMode(enabled: boolean) {
    setRealSunMode(enabled);
    updateLocalSettings({ realSunMode: enabled });
  }

  function markTutorialSeen() {
    updateLocalSettings({ tutorialSeen: true });
  }

  function updateSound(enabled: boolean) {
    if (enabled) {
      try {
        if (!audioContext.current) audioContext.current = new window.AudioContext();
        void audioContext.current.resume().catch(() => {
          setInputError('Sound alert playback was blocked by the browser. Enable sound after interacting with the page.');
        });
      } catch (error) {
        setInputError(error instanceof Error ? `Sound alert unavailable: ${error.message}` : 'Sound alert unavailable.');
      }
    }
    updateLocalSettings({ soundEnabled: enabled });
  }

  useEffect(() => {
    if (replayHandled.current) return;
    replayHandled.current = true;
    const query = new URLSearchParams(window.location.search);
    if (query.get('demo') === '1') {
      loadReplay({
        version: 1,
        seed: 2026,
        scenario: 'mars',
        mode: 'cadet',
        actions: [],
        realSunMode: false,
      });
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    const encoded = query.get(REPLAY_QUERY);
    if (!encoded) return;
    try {
      loadReplay(decodeReplayPayload(encoded));
    } catch (error) {
      setInputError(error instanceof Error ? error.message : 'Invalid replay link.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [loadReplay, setInputError]);

  const topPhase = appPhase === 'operate' || appPhase === 'debrief' || appPhase === 'result';
  return (
    <div className="scanlines flex h-[100dvh] min-h-[560px] w-screen flex-col overflow-hidden bg-zinc-950 text-zinc-50">
      {topPhase && <ResourceBar />}
      {appPhase === 'title' && <main className="min-h-0 flex-1 overflow-y-auto"><TitleScreen /></main>}
      {appPhase === 'select' && <main className="min-h-0 flex-1 overflow-y-auto"><SelectionScreen onScenario={updateScenario} onMode={updateMode} onRealSunMode={updateRealSunMode} onSoundEnabled={updateSound} soundEnabled={localSettingsState.settings.soundEnabled} storageWarning={localSettingsState.warning} sunDataStatus={sunDataStatus} /></main>}
      {appPhase === 'tutorial' && <main className="min-h-0 flex-1 overflow-y-auto"><TutorialScreen onTutorialSeen={markTutorialSeen} /></main>}
      {appPhase === 'design' && <main className="min-h-0 flex-1 overflow-y-auto"><DesignScreen /></main>}
      {appPhase === 'operate' && <OperationsScreen />}
      {appPhase === 'debrief' && <main className="min-h-0 flex-1 overflow-y-auto"><MissionReport success={false} /></main>}
      {appPhase === 'result' && <main className="min-h-0 flex-1 overflow-y-auto"><MissionReport success /></main>}
      {inputError && appPhase !== 'design' && appPhase !== 'operate' && <div role="alert" className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded border border-red-900 bg-red-950 p-3 text-xs text-red-200">{inputError}</div>}
      {appPhase === 'operate' && <OperationsControls />}
    </div>
  );
}

export default App;
