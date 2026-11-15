import { create } from 'zustand';
import {
  DEFAULT_MODE,
  DEFAULT_SCENARIO,
  DEFAULT_SEED,
} from '../engine/constants';
import { applyAction, createInitialMissionState, step } from '../engine/loop';
import { mulberry32 } from '../engine/rng';
import { BUNDLED_SUN_EVENTS } from '../data/sunEvents';
import type {
  Action,
  AppPhase,
  GameState,
  MissionState,
  Mode,
  ReplayPayload,
  Scenario,
  SunEventRecord,
  TickSpeed,
} from '../engine/types';

export { INITIAL_RESOURCES } from '../engine/constants';
export { AVAILABLE_MODULES } from '../engine/modules';

function createMissionState(
  seed: number,
  scenario: Scenario,
  mode: Mode,
  sunEvents: readonly SunEventRecord[],
) {
  return createInitialMissionState(seed, scenario, mode, sunEvents);
}

function missionFlow(phase: AppPhase, seed: number, scenario: Scenario, mode: Mode, sunEvents: readonly SunEventRecord[]) {
  return {
    ...createMissionState(seed, scenario, mode, sunEvents),
    appPhase: phase,
    selectedScenario: scenario,
    selectedMode: mode,
    missionSunEvents: sunEvents.map((event) => ({ ...event })),
    replayActions: [] as Action[],
    replayCursor: 0,
    inputError: '',
  };
}

export const useGameStore = create<GameState>((set) => ({
  ...missionFlow('title', DEFAULT_SEED, DEFAULT_SCENARIO, DEFAULT_MODE, []),
  tickSpeed: 1,
  realSunMode: false,
  sunEvents: BUNDLED_SUN_EVENTS.map((event) => ({ ...event })),

  goToSelect: () => set({ appPhase: 'select', inputError: '' }),

  chooseScenario: (scenario) => set({ selectedScenario: scenario, inputError: '' }),

  chooseMode: (mode) => set({ selectedMode: mode, inputError: '' }),

  enterTutorial: () =>
    set((state) => ({
      ...missionFlow(
        'tutorial',
        DEFAULT_SEED,
        state.selectedScenario,
        state.selectedMode,
        state.realSunMode ? state.sunEvents : [],
      ),
      tickSpeed: state.tickSpeed,
      realSunMode: state.realSunMode,
      sunEvents: state.sunEvents,
    })),

  skipTutorial: () =>
    set((state) =>
      state.appPhase === 'tutorial' ? { appPhase: 'design' } : state,
    ),

  finishTutorial: () =>
    set((state) =>
      state.appPhase === 'tutorial' ? { appPhase: 'design' } : state,
    ),

  startMission: (seed = DEFAULT_SEED) =>
    set((state) => ({
      ...missionFlow(
        'design',
        seed,
        state.selectedScenario,
        state.selectedMode,
        state.realSunMode ? state.sunEvents : [],
      ),
      tickSpeed: state.tickSpeed,
      realSunMode: state.realSunMode,
      sunEvents: state.sunEvents,
    })),

  startOperations: () =>
    set((state) => {
      if (state.appPhase !== 'design') return state;
      return { appPhase: 'operate', isPaused: false, inputError: '' };
    }),

  setTickSpeed: (speed: TickSpeed) => set({ tickSpeed: speed }),

  setRealSunMode: (enabled) => set({ realSunMode: enabled }),

  setSunEvents: (events) => set({ sunEvents: events }),

  loadReplay: (payload: ReplayPayload) =>
    set(() => {
      const base = missionFlow(
        'operate',
        payload.seed,
        payload.scenario,
        payload.mode,
        payload.realSunMode ? payload.sunEvents ?? [] : [],
      );
      return {
        ...base,
        isPaused: false,
        tickSpeed: 5,
        realSunMode: payload.realSunMode ?? false,
        sunEvents: payload.sunEvents ?? [],
        missionSunEvents: payload.realSunMode ? (payload.sunEvents ?? []).map((event) => ({ ...event })) : [],
        replayActions: payload.actions,
        replayCursor: 0,
      };
    }),

  setInputError: (message) => set({ inputError: message }),

  togglePause: () =>
    set((state) => {
      if (state.gameOver || state.missionResult?.success || state.appPhase !== 'operate') {
        return state;
      }
      return { isPaused: !state.isPaused };
    }),

  buildModule: (moduleId) =>
    set((state) => {
      if (state.appPhase !== 'design') {
        return { inputError: 'Modules can only be deployed during the Design phase.' };
      }
      const nextState = applyAction(state, {
        day: state.daysPassed,
        type: 'deploy-module',
        payload: { moduleId },
      });
      return {
        ...nextState,
        inputError:
          nextState.actionLog.at(-1)?.status === 'rejected'
            ? nextState.actionLog.at(-1)?.message ?? 'Module deployment was rejected.'
            : '',
      };
    }),

  dispatchAction: (action: Action) =>
    set((state) => {
      if (state.appPhase !== 'operate') {
        return { inputError: 'This action is only available during operations.' };
      }
      const nextState = applyAction(state, action);
      return {
        ...nextState,
        inputError:
          nextState.actionLog.at(-1)?.status === 'rejected'
            ? nextState.actionLog.at(-1)?.message ?? 'Action was rejected.'
            : '',
      };
    }),

  tick: () =>
    set((state) => {
      if (
        state.appPhase !== 'operate' ||
        state.isPaused ||
        state.gameOver ||
        state.missionResult?.success
      ) {
        return state;
      }

      let mission: MissionState = state;
      let replayCursor = state.replayCursor;
      while (
        replayCursor < state.replayActions.length &&
        state.replayActions[replayCursor].day === mission.daysPassed
      ) {
        mission = applyAction(mission, state.replayActions[replayCursor]);
        replayCursor += 1;
      }

      const nextState = step(mission, mulberry32(state.seed));
      const nextDay = nextState.daysPassed;
      const pausedByEvent = nextState.events.some(
        (event) =>
          event.startDay === nextDay || event.warningStartDay === nextDay,
      );
      const appPhase = nextState.gameOver
        ? 'debrief'
        : nextState.missionResult?.success
          ? 'result'
          : state.appPhase;

      return {
        ...nextState,
        appPhase,
        isPaused: nextState.gameOver || nextState.missionResult?.success === true || pausedByEvent,
        replayCursor,
      };
    }),

  restartMission: () =>
    set((state) => ({
      ...missionFlow(
        'design',
        DEFAULT_SEED,
        state.selectedScenario,
        state.selectedMode,
        state.realSunMode ? state.sunEvents : [],
      ),
      tickSpeed: state.tickSpeed,
      realSunMode: state.realSunMode,
      sunEvents: state.sunEvents,
    })),
}));
