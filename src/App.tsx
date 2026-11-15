import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  GitBranch,
  Globe2,
  Moon,
  Radio,
  RefreshCw,
  Settings2,
  Sun,
} from 'lucide-react';
import { MISSION_DURATION_DAYS } from './engine/constants';
import { createReplayPayload, decodeReplayPayload, encodeReplayPayload } from './engine/share';
import { loadSunEventsFromDonki } from './services/nasaDonki';
import { useGameStore } from './store/gameStore';
import ResourceBar from './components/hud/ResourceBar';
import TimeControls from './components/hud/TimeControls';
import BuildMenu from './components/hud/BuildMenu';
import Grid from './components/base/Grid';
import EnvironmentRenderer from './components/environment/EnvironmentRenderer';
import MissionConfigurationPanel from './components/mission/MissionConfigurationPanel';
import ResourceFlow from './components/base/ResourceFlow';
import AdvisorChat from './components/overlays/AdvisorChat';
import {
  loadBestRun,
  loadLocalSettings,
  saveBestRun,
  saveLocalSettings,
} from './storage/localData';
import type { LocalSettings } from './storage/localData';
import type { Action, CauseLog, Mode, Scenario } from './engine/types';

const REPLAY_QUERY = 'share';

function isCriticalLog(log: string) {
  return log.includes('CRITICAL') || log.includes('WARNING') || log.includes('STARVED');
}

function PhaseBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-cyan-800/60 bg-cyan-950/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-cyan-300 shadow-sm">
      {children}
    </span>
  );
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
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-black transition-all hover:from-cyan-400 hover:to-cyan-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function TitleScreen() {
  const goToSelect = useGameStore((state) => state.goToSelect);
  const best = loadBestRun();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
      <section className="glass-panel w-full max-w-4xl overflow-hidden rounded-2xl border border-cyan-500/40 shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-fade-in-up">
        <div className="grid md:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 sm:p-10">
            <PhaseBadge>
              <Radio className="h-3 w-3" /> Mission Control · Training Sim
            </PhaseBadge>
            <h2 className="mt-5 text-3xl font-black uppercase leading-tight tracking-[0.14em] sm:text-5xl text-glow-cyan">
              Build a base.
              <br />
              <span className="text-cyan-300">Keep them alive.</span>
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-300">
              Design and command an autonomous 2.5D lunar outpost. Balance power grids, oxygen synthesis, water reclamation, and radiation shielding through 30 mission days.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <PrimaryButton onClick={goToSelect} testId="start-mission">
                Start Mission <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
              <div className="flex items-center gap-2 font-hud text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <Clock3 className="h-4 w-4 text-cyan-400" /> ~5 min mission · deterministic
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between border-t border-zinc-800/80 bg-black/40 p-6 md:border-l md:border-t-0 sm:p-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
                Mission Parameters
              </p>
              <ul className="mt-4 space-y-3 text-xs text-zinc-300">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 flex-none text-emerald-400" /> Real NASA Donki SEP telemetry.
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 flex-none text-emerald-400" /> Dynamic closed-loop life support.
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 flex-none text-emerald-400" /> Multi-tiered causal debrief analysis.
                </li>
              </ul>
            </div>
            <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500">Best local run</p>
              <p className="mt-1 font-hud text-lg font-bold text-cyan-300 text-glow-cyan">
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
  onBriefingEnabled,
  briefingEnabled,
  soundEnabled,
  storageWarning,
  sunDataStatus,
}: {
  onScenario: (scenario: Scenario) => void;
  onMode: (mode: Mode) => void;
  onRealSunMode: (enabled: boolean) => void;
  onSoundEnabled: (enabled: boolean) => void;
  onBriefingEnabled: (enabled: boolean) => void;
  briefingEnabled: boolean;
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
      <section className="glass-panel w-full max-w-4xl rounded-2xl border border-cyan-500/40 p-6 sm:p-8 shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-fade-in-up">
        <PhaseBadge>
          <Globe2 className="h-3 w-3" /> Mission Configuration
        </PhaseBadge>
        <h2 className="mt-4 text-2xl font-black uppercase tracking-widest text-glow-cyan">
          Choose Your Outpost
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <fieldset>
            <legend className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Destination World
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {(['mars', 'moon'] as const).map((world) => (
                <button
                  type="button"
                  key={world}
                  aria-pressed={scenario === world}
                  onClick={() => onScenario(world)}
                  className={`min-h-24 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    scenario === world
                      ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                      : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-600'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                    {world === 'mars' ? (
                      <Globe2 className="h-4 w-4 text-orange-400" />
                    ) : (
                      <Moon className="h-4 w-4 text-cyan-300" />
                    )}
                    {world}
                  </span>
                  <span className="mt-2 block text-[10px] leading-relaxed text-zinc-400">
                    {world === 'mars'
                      ? 'Dust storms, delayed comms, variable solar radiation.'
                      : 'Long lunar nights, vacuum thermal swings, stored power.'}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Difficulty / Flight Systems
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {(['cadet', 'engineer'] as const).map((level) => (
                <button
                  type="button"
                  key={level}
                  aria-pressed={mode === level}
                  onClick={() => onMode(level)}
                  className={`min-h-24 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    mode === level
                      ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                      : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-600'
                  }`}
                >
                  <span className="text-sm font-bold uppercase tracking-wider">{level}</span>
                  <span className="mt-2 block text-[10px] leading-relaxed text-zinc-400">
                    {level === 'cadet'
                      ? 'Streamlined gauges, advisory warnings and assistance.'
                      : 'Full engineering telemetry, radiation exposure, live priority bus.'}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <Sun className="h-4 w-4 text-amber-400" /> Real Sun Mode (NASA DONKI SEP)
            </p>
            <p className="mt-1 text-[10px] text-zinc-400">
              Replay historical Solar Energetic Particle records. {sunEventCount} records available. {sunDataStatus}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={realSunMode}
            onClick={() => onRealSunMode(!realSunMode)}
            className={`relative h-8 w-14 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              realSunMode ? 'border-cyan-400 bg-cyan-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]' : 'border-zinc-700 bg-zinc-800'
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full transition-all ${
                realSunMode ? 'left-7 bg-cyan-300' : 'left-1 bg-zinc-400'
              }`}
            />
            <span className="sr-only">Toggle Real Sun Mode</span>
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex min-h-10 items-center gap-3 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={briefingEnabled}
              onChange={(event) => onBriefingEnabled(event.target.checked)}
              className="h-4 w-4 accent-cyan-500 rounded"
            />
            Include interactive 90-second briefing
          </label>
          <label className="flex min-h-10 items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(event) => onSoundEnabled(event.target.checked)}
              className="h-4 w-4 accent-cyan-500 rounded"
            />
            Audio alerts enabled
          </label>
        </div>

        {storageWarning && (
          <p role="status" className="mt-2 text-[10px] text-amber-300">
            {storageWarning}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-zinc-800/80 pt-4">
          <button
            type="button"
            onClick={() => onBriefingEnabled(true)}
            className="min-h-11 rounded px-4 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            Reset briefing
          </button>
          <PrimaryButton
            onClick={() => (briefingEnabled ? enterTutorial() : startMission())}
            testId="continue-selection"
          >
            Deploy Base <ChevronRight className="h-4 w-4" />
          </PrimaryButton>
        </div>
      </section>
    </div>
  );
}

const TUTORIAL_QUESTIONS = [
  {
    prompt: 'A power shortage is coming. Which system should keep highest power priority?',
    options: ['Life-support oxygen systems', 'Decorative lighting'],
    answer: 0,
    explanation: 'Life support takes absolute priority over auxiliary systems.',
  },
  {
    prompt: 'A lunar outpost experiences two weeks of total night. What closes the gap?',
    options: ['More solar panels alone', 'A reactor and stored battery power'],
    answer: 1,
    explanation: 'Solar arrays cannot generate during lunar night; steady generation and batteries bridge the window.',
  },
  {
    prompt: 'A solar particle event warning arrives. What immediate command protects crew?',
    options: ['Order the crew into the shelter', 'Wait until the event ends'],
    answer: 0,
    explanation: 'The warning window gives actionable time to order the crew into reinforced storm shelter.',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
      <section className="glass-panel w-full max-w-3xl rounded-2xl border border-cyan-500/40 p-6 sm:p-8 shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-fade-in-up">
        <PhaseBadge>
          <BookOpen className="h-3 w-3" /> Flight Briefing · {questionIndex + 1} of{' '}
          {TUTORIAL_QUESTIONS.length}
        </PhaseBadge>
        <div className="mt-4 h-1 overflow-hidden rounded bg-zinc-800">
          <div
            className="h-full bg-cyan-400 transition-all shadow-[0_0_10px_rgba(6,182,212,0.8)]"
            style={{ width: `${((questionIndex + 1) / TUTORIAL_QUESTIONS.length) * 100}%` }}
          />
        </div>
        <h2 className="mt-5 text-xl font-black uppercase tracking-wider text-glow-cyan">
          Mission Survival Systems
        </h2>
        <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm leading-relaxed text-zinc-200">
          {question.prompt}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {question.options.map((option, index) => (
            <button
              type="button"
              key={option}
              onClick={() => answer(index)}
              className="min-h-14 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-left text-xs font-bold text-zinc-200 hover:border-cyan-400 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              {option}
            </button>
          ))}
        </div>
        <p
          aria-live="polite"
          className={`mt-4 min-h-6 text-xs font-semibold ${
            feedback.startsWith('Not') ? 'text-amber-300' : 'text-emerald-300'
          }`}
        >
          {feedback}
        </p>
        <div className="mt-5 flex justify-end border-t border-zinc-800/80 pt-3">
          <button
            type="button"
            onClick={() => {
              onTutorialSeen();
              skipTutorial();
            }}
            className="min-h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            Skip briefing
          </button>
        </div>
      </section>
    </div>
  );
}


function CommsPanel() {
  const logs = useGameStore((state) => state.logs);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  type DailyStatus = {
    oxygen: number;
    power: number;
    water: number;
    food: number;
    radiation: number;
    morale: number;
  };

  type DayEntry = {
    day: number;
    logs: string[];
    status?: DailyStatus;
  };

  // Group existing mission logs by day.
  const dayMap = new Map<number, DayEntry>();
  const systemLogs: string[] = [];

  logs.forEach((log) => {
    const dayMatch = log.match(/\bDay\s+(\d+)\b/i);

    if (!dayMatch) {
      systemLogs.push(log);
      return;
    }

    const dayNumber = Number(dayMatch[1]);

    if (!dayMap.has(dayNumber)) {
      dayMap.set(dayNumber, {
        day: dayNumber,
        logs: [],
      });
    }

    const entry = dayMap.get(dayNumber)!;
    entry.logs.push(log);

    // Parse existing daily telemetry generated by loop.ts.
    const statusMatch = log.match(
      /STATUS:\s*O[₂2]\s*([\d.]+)\s*-\s*PWR\s*([\d.]+)\s*-\s*H[₂2]O\s*([\d.]+)\s*-\s*FOOD\s*([\d.]+)\s*-\s*RAD\s*([\d.]+)\s*-\s*MORALE\s*([\d.]+)/i
    );

    if (statusMatch) {
      entry.status = {
        oxygen: Number(statusMatch[1]),
        power: Number(statusMatch[2]),
        water: Number(statusMatch[3]),
        food: Number(statusMatch[4]),
        radiation: Number(statusMatch[5]),
        morale: Number(statusMatch[6]),
      };
    }
  });

  const timeline = Array.from(dayMap.values())
    .sort((a, b) => b.day - a.day)
    .slice(0, 60);

  const latestDay = timeline[0]?.day ?? 0;

  const criticalCount = logs.filter(isCriticalLog).length;

  const metrics = [
    { key: 'O₂', field: 'oxygen' as const, cap: 120, color: 'bg-cyan-400' },
    { key: 'PWR', field: 'power' as const, cap: 100, color: 'bg-amber-400' },
    { key: 'H₂O', field: 'water' as const, cap: 120, color: 'bg-blue-400' },
    { key: 'FOOD', field: 'food' as const, cap: 120, color: 'bg-emerald-400' },
    { key: 'RAD', field: 'radiation' as const, cap: 45, color: 'bg-red-400' },
    { key: 'MORALE', field: 'morale' as const, cap: 100, color: 'bg-violet-400' },
  ];

  function getDaySeverity(entry: DayEntry) {
    if (entry.logs.some((log) => isCriticalLog(log))) return 'critical';

    if (
      entry.logs.some(
        (log) =>
          log.includes('WARNING') ||
          log.includes('EVENT') ||
          log.includes('STARVED')
      )
    ) {
      return 'warning';
    }

    return 'normal';
  }

  return (
    <aside
      className={`glass-hud fixed left-3 top-16 z-30 flex flex-col overflow-hidden rounded-xl border border-zinc-700/60 bg-zinc-950/90 backdrop-blur-xl transition-all duration-300 ${
        collapsed
          ? 'h-12 w-52'
          : 'w-64 sm:w-72 max-h-[calc(100vh-5.5rem)]'
      }`}
      aria-label="Mission timeline and communications"
    >
      {/* HEADER */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/40">
            <Radio className="h-4 w-4 text-cyan-400" />

            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-zinc-950 bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.8)] animate-pulse" />
          </div>

          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-100">
              Mission Timeline
            </h2>

            <p className="mt-0.5 flex items-center gap-1 text-[8px] font-hud uppercase tracking-widest text-zinc-500">
              <span className="text-emerald-400">●</span>
              Live telemetry · {timeline.length} days
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 transition-all hover:border-cyan-500/50 hover:bg-cyan-950/40 hover:text-cyan-300"
          aria-label={collapsed ? 'Expand timeline' : 'Collapse timeline'}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* TIMELINE CONTENT */}
      {!collapsed && (
        <div className="min-h-0 flex-1 overflow-y-auto p-3 custom-scrollbar">
          {/* MISSION PROGRESS */}
          <div className="mb-4 rounded-lg border border-zinc-800 bg-black/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">
                Mission progress
              </span>

              <span className="font-hud text-[10px] font-bold text-cyan-300">
                DAY {latestDay.toString().padStart(2, '0')} / 30
              </span>
            </div>

            <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-300 transition-all duration-700"
                style={{
                  width: `${Math.min(100, (latestDay / 30) * 100)}%`,
                }}
              />
            </div>

            <div className="mt-2 flex justify-between text-[8px] text-zinc-500">
              <span>MISSION START</span>
              <span>{Math.round((latestDay / 30) * 100)}% COMPLETE</span>
            </div>
          </div>

          {/* TIMELINE HEADING */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
              Daily transmissions
            </span>

            <span className="text-[8px] font-hud text-zinc-600">
              NEWEST FIRST
            </span>
          </div>

          {/* DAY-BY-DAY TIMELINE */}
          {timeline.length > 0 ? (
            <div className="relative space-y-2">
              {/* Continuous timeline line */}
              <div className="absolute bottom-5 left-[11px] top-3 w-px bg-gradient-to-b from-cyan-400/70 via-cyan-800/40 to-transparent" />

              {timeline.map((entry) => {
                const severity = getDaySeverity(entry);
                const expanded = expandedDay === entry.day;
                const isLatest = entry.day === latestDay;

                const severityStyles = {
                  critical: {
                    dot: 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]',
                    border: 'border-red-800/60',
                    badge: 'text-red-400 bg-red-950/50',
                  },
                  warning: {
                    dot: 'bg-amber-400 shadow-[0_0_9px_rgba(251,191,36,0.7)]',
                    border: 'border-amber-800/50',
                    badge: 'text-amber-400 bg-amber-950/40',
                  },
                  normal: {
                    dot: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.65)]',
                    border: 'border-zinc-800',
                    badge: 'text-emerald-400 bg-emerald-950/30',
                  },
                };

                const style = severityStyles[severity];

                return (
                  <div
                    key={entry.day}
                    className="relative pl-7 animate-fade-in-up"
                  >
                    {/* Timeline node */}
                    <div
                      className={`absolute left-[7px] top-4 z-10 h-[9px] w-[9px] rounded-full border-2 border-zinc-950 transition-all duration-300 ${
                        style.dot
                      } ${isLatest ? 'ring-2 ring-cyan-400/20' : ''}`}
                    />

                    {/* DAY CARD */}
                    <div
                      className={`overflow-hidden rounded-lg border transition-all duration-300 ${
                        expanded
                          ? 'border-cyan-500/40 bg-zinc-900/90 shadow-[0_4px_18px_rgba(0,0,0,0.3)]'
                          : `${style.border} bg-zinc-950/60 hover:border-zinc-600 hover:bg-zinc-900/80`
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDay(expanded ? null : entry.day)
                        }
                        aria-expanded={expanded}
                        className="w-full p-2.5 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-hud text-[11px] font-black tracking-wider text-zinc-100">
                              DAY {entry.day.toString().padStart(2, '0')}
                            </span>

                            {isLatest && (
                              <span className="rounded border border-cyan-700/50 bg-cyan-950/60 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-cyan-300">
                                Latest
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {severity !== 'normal' && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[7px] font-black uppercase ${style.badge}`}
                              >
                                {severity}
                              </span>
                            )}

                            <ChevronDown
                              className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-300 ${
                                expanded ? 'rotate-180 text-cyan-400' : ''
                              }`}
                            />
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[8px] text-zinc-500">
                          <span>
                            {entry.status ? 'SYSTEM TELEMETRY' : 'MISSION EVENT'}
                          </span>

                          <span>
                            {entry.logs.length} transmission
                            {entry.logs.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Compact resource telemetry */}
                        {entry.status && (
                          <div className="mt-2 grid grid-cols-3 gap-x-2 gap-y-2">
                            {metrics.map((metric) => {
                              const value = entry.status![metric.field];
                              const percentage = Math.max(
                                0,
                                Math.min(100, (value / metric.cap) * 100)
                              );

                              return (
                                <div key={metric.key} className="min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[7px] font-bold text-zinc-500">
                                      {metric.key}
                                    </span>

                                    <span className="font-hud text-[8px] font-bold text-zinc-300">
                                      {value.toFixed(1)}
                                    </span>
                                  </div>

                                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-800">
                                    <div
                                      className={`h-full rounded-full ${metric.color} transition-all duration-700`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </button>

                      {/* EXPANDABLE EVENT DETAILS */}
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${
                          expanded
                            ? 'grid-rows-[1fr] opacity-100'
                            : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="space-y-1 border-t border-zinc-800/80 p-2">
                            {entry.logs
                              .filter((log) => !/STATUS:/i.test(log))
                              .map((log, index) => {
                                const critical = isCriticalLog(log);
                                const warning =
                                  !critical &&
                                  (log.includes('WARNING') ||
                                    log.includes('EVENT'));

                                return (
                                  <div
                                    key={`${entry.day}-${index}`}
                                    className={`rounded-md border p-2 text-[9px] leading-relaxed ${
                                      critical
                                        ? 'border-red-800/50 bg-red-950/30 text-red-300'
                                        : warning
                                          ? 'border-amber-800/40 bg-amber-950/20 text-amber-300'
                                          : 'border-zinc-800 bg-black/30 text-zinc-400'
                                    }`}
                                  >
                                    {log}
                                  </div>
                                );
                              })}

                            {entry.logs.every((log) => /STATUS:/i.test(log)) && (
                              <p className="py-2 text-center text-[8px] text-zinc-500">
                                No additional events recorded for this day.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-800 p-5 text-center">
              <Radio className="mx-auto h-6 w-6 text-zinc-600" />
              <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                Awaiting telemetry
              </p>
              <p className="mt-1 text-[8px] text-zinc-600">
                Mission transmissions will appear here.
              </p>
            </div>
          )}

          {/* INITIALIZATION LOG */}
          {systemLogs.length > 0 && (
            <div className="relative mt-4 pl-7">
              <div className="absolute left-[7px] top-3 h-2 w-2 rounded-full border border-zinc-600 bg-zinc-800" />

              <div className="rounded-lg border border-zinc-800 bg-black/40 p-2.5">
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
                  System initialization
                </p>

                {systemLogs.slice(-3).map((log, index) => (
                  <p
                    key={`system-${index}`}
                    className="mt-1 text-[8px] leading-relaxed text-zinc-500"
                  >
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="mt-4 flex items-center justify-between border-t border-zinc-800/70 pt-3">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">
                Total transmissions
              </p>
              <p className="mt-0.5 font-hud text-xs font-bold text-cyan-300">
                {logs.length.toString().padStart(3, '0')}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">
                Alerts recorded
              </p>
              <p
                className={`mt-0.5 font-hud text-xs font-bold ${
                  criticalCount > 0 ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {criticalCount.toString().padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
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
  const safety =
    Math.max(
      0,
      Math.min(
        state.resources.oxygen / 120,
        state.resources.power / state.resourceCaps.power,
        state.resources.water / 120,
        state.resources.food / 120,
        1 - state.resources.radiationDose / state.resourceCaps.radiationDose,
      ),
    ) * 25;
  const usedMass = state.resourceCaps.massBudget - state.resources.massBudget;
  const efficiency = Math.max(0, 15 * (1 - usedMass / state.resourceCaps.massBudget));
  const score = Math.round(survival + safety + efficiency);
  return {
    score,
    grade:
      score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 65 ? 'C' : score >= 50 ? 'D' : 'E',
  };
}

function MissionReport({ success }: { success: boolean }) {
  const state = useGameStore();
  const retry = useGameStore((game) => game.restartMission);
  const setInputError = useGameStore((game) => game.setInputError);
  const [shareLink, setShareLink] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const score = calculateScore();
  const chain = causeChain(state.causeLog);
  const actions: Action[] = state.actionLog
    .filter((entry) => entry.status === 'applied')
    .map((entry) => entry.action);

  useEffect(() => {
    const warning = saveBestRun({ days: state.daysPassed, score: score.score });
    if (warning) setInputError(warning);
  }, [score.score, setInputError, state.daysPassed]);

  async function shareRun() {
    const missionUsesRealSunMode = state.missionSunEvents.length > 0;
    const payload = createReplayPayload(state.seed, state.scenario, state.mode, actions, {
      sunEvents: missionUsesRealSunMode ? state.missionSunEvents : undefined,
      realSunMode: missionUsesRealSunMode,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 overflow-y-auto">
      <section className="glass-panel w-full max-w-4xl overflow-hidden rounded-2xl border border-cyan-500/40 shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-fade-in-up my-auto">
        <div
          className={`border-b p-5 sm:p-7 ${
            success
              ? 'border-emerald-900 bg-emerald-950/40'
              : 'border-red-900 bg-red-950/40'
          }`}
        >
          <PhaseBadge>
            {success ? 'Mission complete' : 'Mission terminated'} · Day {state.daysPassed}
          </PhaseBadge>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-widest text-glow-cyan">
            {success ? 'Outpost sustained' : 'Mission debrief'}
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            {success ? 'The crew completed the 30-day mission.' : state.debriefReason}
          </p>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-[0.8fr_1.2fr] sm:p-7">
          <div>
            {success && (
              <div className="rounded-xl border border-zinc-700 bg-zinc-950/80 p-4 text-center">
                <p className="text-[9px] uppercase tracking-widest text-zinc-500">
                  Mission score · grade
                </p>
                <p className="mt-2 text-4xl font-black text-cyan-300 text-glow-cyan">
                  {score.score} <span className="text-2xl">{score.grade}</span>
                </p>
              </div>
            )}
            <h3 className="mt-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Root cause timeline
            </h3>
            <ol className="mt-3 space-y-2 border-l border-zinc-700 pl-4">
              {chain.length > 0 ? (
                chain.map((cause) => (
                  <li key={cause.id} className="relative text-[10px] leading-relaxed text-zinc-300">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border border-zinc-950 bg-amber-400" />
                    <span className="font-hud text-cyan-300">
                      Day {cause.day} · {cause.system}
                    </span>
                    <br />
                    {cause.reason}
                  </li>
                ))
              ) : (
                <li className="text-xs text-zinc-500">
                  No failure chain. Review the daily comms log.
                </li>
              )}
            </ol>
            {!success && (
              <div className="mt-4 rounded-xl border border-cyan-900 bg-cyan-950/40 p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-300">
                  What might have saved the mission?
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-zinc-300">
                  {chain.some((cause) => cause.system === 'power')
                    ? 'Add redundant power generation or battery storage before starting the lunar night or dust-storm window.'
                    : chain.some((cause) => cause.system === 'radiationDose')
                      ? 'Deploy regolith shielding and order the crew into the storm shelter when the warning arrives.'
                      : 'Increase the relevant life-support reserve and add a production/recycling module before operations.'}
                </p>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Complete mission timeline
            </h3>
            <div className="mt-3 max-h-72 space-y-1 overflow-y-auto rounded-xl border border-zinc-800 bg-black/40 p-3 font-hud text-[9px]">
              {state.logs.map((log, index) => (
                <p
                  key={`${index}-${log}`}
                  className={`border-b border-zinc-800/70 py-1 ${
                    isCriticalLog(log)
                      ? 'text-red-300'
                      : log.includes('EVENT')
                        ? 'text-amber-300'
                        : 'text-zinc-400'
                  }`}
                >
                  {log}
                </p>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 p-4 sm:px-7">
          <div className="flex flex-wrap gap-2">
            <PrimaryButton onClick={retry}>
              <RefreshCw className="h-4 w-4" /> Retry mission
            </PrimaryButton>
            <button
              type="button"
              onClick={shareRun}
              className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 text-[10px] font-bold uppercase tracking-wider text-zinc-200 hover:border-cyan-400 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              Share replay
            </button>
          </div>
          <p aria-live="polite" className="text-[10px] text-zinc-400">
            {copyMessage || state.inputError}
          </p>
          {shareLink && (
            <input
              aria-label="Replay link"
              readOnly
              value={shareLink}
              onFocus={(event) => event.currentTarget.select()}
              className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-[10px] text-cyan-200"
            />
          )}
        </div>
      </section>
    </div>
  );
}

function App() {
  const appPhase = useGameStore((state) => state.appPhase);
  const selectedScenario = useGameStore((state) => state.selectedScenario);
  const selectedMode = useGameStore((state) => state.selectedMode);
  const activeEvents = useGameStore((state) => state.activeEvents);
  const sunEventCount = useGameStore((state) => state.sunEvents.length);
  const power = useGameStore((state) => state.resources.power);
  const oxygen = useGameStore((state) => state.resources.oxygen);
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
  const [sunDataStatus, setSunDataStatus] = useState(
    'Bundled archive ready; NASA refresh runs when Real Sun Mode is enabled.',
  );
  const [demoMode] = useState(
    () => new URLSearchParams(window.location.search).get('demo') === '1',
  );

  // Tactical overlay toggles for AI advisor and resource conduits
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [showResourceFlow, setShowResourceFlow] = useState(false);
  const [showMissionSettings, setShowMissionSettings] = useState(false);

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
    void loadSunEventsFromDonki()
      .then((result) => {
        if (!active) return;
        setSunEvents(result.events);
        setSunDataStatus(
          result.warning ||
            `Loaded ${result.events.length} recent records from NASA DONKI.`,
        );
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message =
          error instanceof Error ? error.message : 'Unexpected DONKI loading error.';
        setSunDataStatus(`NASA DONKI refresh failed: ${message}. Using bundled archive.`);
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
        setInputError(
          'Sound alert blocked by browser. Enable sound from mission settings after interacting.',
        );
      });
    } catch (error) {
      setInputError(
        error instanceof Error ? `Sound alert unavailable: ${error.message}` : 'Sound alert unavailable.',
      );
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

  function updateBriefing(enabled: boolean) {
    updateLocalSettings({ briefingEnabled: enabled });
  }

  function markTutorialSeen() {
    updateLocalSettings({ tutorialSeen: true });
  }

  function updateSound(enabled: boolean) {
    if (enabled) {
      try {
        if (!audioContext.current) audioContext.current = new window.AudioContext();
        void audioContext.current.resume().catch(() => {
          setInputError(
            'Sound playback blocked by browser. Enable sound after interacting.',
          );
        });
      } catch (error) {
        setInputError(
          error instanceof Error ? `Sound alert unavailable: ${error.message}` : 'Sound alert unavailable.',
        );
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

  return (
    <div
      className="relative h-[100dvh] w-screen overflow-hidden bg-black text-zinc-50 select-none"
      data-scenario={selectedScenario}
    >
      <EnvironmentRenderer
        scenario={selectedScenario}
        events={activeEvents}
        power={power}
        oxygen={oxygen}
      />

      {/* Atmospheric Radial Vignette Overlay to focus eye on the base */}
      <div className="vignette-radial absolute inset-0 z-10" />

      {/* CRT Scanline Overlay */}
      <div className="scanline-overlay absolute inset-0 z-20" />

      {/* LAYER 2 & 3: The 2.5D Isometric Outpost Base Grid (Absolute Center) */}
      <main className="absolute inset-0 z-20 flex items-center justify-center overflow-auto px-4 py-16">
        <Grid />
      </main>

      {/* LAYER 4: The Edge-Aligned Futuristic HUD */}
      {/* Top Edge: Telemetry ResourceBar */}
      <ResourceBar />

      {/* Left Edge: Comms Transmissions Log */}
      <CommsPanel />

      {/* Right Edge: Blueprint Construction Menu */}
      <BuildMenu />

      {/* Floating Tactical Quick-Actions Bar (Bottom-Right / Floating pill) */}
      <div className="fixed bottom-14 right-3 z-40 flex max-w-[calc(100vw-1.5rem)] items-center gap-1.5 sm:right-4 sm:gap-2">
        <button
          type="button"
          aria-label="Mission settings"
          aria-expanded={showMissionSettings}
          aria-controls="mission-settings-title"
          onClick={() => setShowMissionSettings(!showMissionSettings)}
          className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sm:px-3 ${
            showMissionSettings
              ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'border-zinc-700/80 bg-zinc-950/80 text-zinc-300 hover:border-zinc-500 hover:text-white'
          }`}
        >
          <Settings2 className="h-3.5 w-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Mission Settings</span>
        </button>
        <button
          type="button"
          aria-label="AI Advisor"
          onClick={() => setShowAdvisor(!showAdvisor)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-md transition-all ${
            showAdvisor
              ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'border-zinc-700/80 bg-zinc-950/70 text-zinc-400 hover:text-white hover:border-zinc-500'
          }`}
        >
          <Bot className="h-3.5 w-3.5 text-cyan-400" />
          <span className="hidden sm:inline">AI Advisor</span>
        </button>
        <button
          type="button"
          aria-label="Conduit Flows"
          onClick={() => setShowResourceFlow(!showResourceFlow)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-md transition-all ${
            showResourceFlow
              ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'border-zinc-700/80 bg-zinc-950/70 text-zinc-400 hover:text-white hover:border-zinc-500'
          }`}
        >
          <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Conduit Flows</span>
        </button>
      </div>

      {showMissionSettings && (appPhase === 'design' || appPhase === 'operate') && (
        <MissionConfigurationPanel
          scenario={selectedScenario}
          mode={selectedMode}
          realSunMode={realSunMode}
          briefingEnabled={localSettingsState.settings.briefingEnabled}
          soundEnabled={localSettingsState.settings.soundEnabled}
          sunEventCount={sunEventCount}
          sunDataStatus={sunDataStatus}
          storageWarning={localSettingsState.warning}
          onScenario={updateScenario}
          onMode={updateMode}
          onRealSunMode={updateRealSunMode}
          onBriefing={updateBriefing}
          onSoundEnabled={updateSound}
          onClose={() => setShowMissionSettings(false)}
        />
      )}

      {/* Floating Resource Flow Diagram Modal */}
      {showResourceFlow && (
        <div className="fixed inset-x-4 top-16 bottom-16 z-50 mx-auto max-w-4xl overflow-y-auto rounded-2xl border border-cyan-500/50 bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-xl animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300">
              Closed-Loop Resource Conduits
            </h3>
            <button
              type="button"
              onClick={() => setShowResourceFlow(false)}
              className="text-zinc-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
          <ResourceFlow />
        </div>
      )}

      {/* Floating Advisor Chat Modal */}
      {showAdvisor && (
        <div className="fixed right-4 bottom-16 z-50 w-full max-w-md overflow-hidden rounded-2xl border border-cyan-500/50 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <Bot className="h-4 w-4" /> Flight Director AI
            </h3>
            <button
              type="button"
              onClick={() => setShowAdvisor(false)}
              className="text-zinc-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <AdvisorChat />
        </div>
      )}

      {/* Bottom Edge: Simulation Speed & Operational Controls */}
      <TimeControls />

      {/* Top-Level Phase Modal Overlays */}
      {appPhase === 'title' && <TitleScreen />}
      {appPhase === 'select' && (
        <SelectionScreen
          onScenario={updateScenario}
          onMode={updateMode}
          onRealSunMode={updateRealSunMode}
          onSoundEnabled={updateSound}
          onBriefingEnabled={updateBriefing}
          briefingEnabled={localSettingsState.settings.briefingEnabled}
          soundEnabled={localSettingsState.settings.soundEnabled}
          storageWarning={localSettingsState.warning}
          sunDataStatus={sunDataStatus}
        />
      )}
      {appPhase === 'tutorial' && <TutorialScreen onTutorialSeen={markTutorialSeen} />}
      {appPhase === 'debrief' && <MissionReport success={false} />}
      {appPhase === 'result' && <MissionReport success />}

      {/* Input Error Banner */}
      {inputError && appPhase !== 'design' && appPhase !== 'operate' && (
        <div
          role="alert"
          className="fixed bottom-16 left-4 right-4 z-50 mx-auto max-w-lg rounded-xl border border-red-800 bg-red-950/90 p-3 text-xs text-red-200 shadow-2xl backdrop-blur-md animate-fade-in-up"
        >
          {inputError}
        </div>
      )}
    </div>
  );
}

export default App;
