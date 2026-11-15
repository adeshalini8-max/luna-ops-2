
import { create } from 'zustand';

import {
  DEFAULT_MODE,
  DEFAULT_SCENARIO,
  DEFAULT_SEED,
} from '../engine/constants';

import {
  applyAction,
  createInitialMissionState,
  step,
} from '../engine/loop';

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

/* ================================================================
   MISSION STATE FACTORIES
   ================================================================ */

function createMissionState(
  seed: number,
  scenario: Scenario,
  mode: Mode,
  sunEvents: readonly SunEventRecord[],
) {
  return createInitialMissionState(
    seed,
    scenario,
    mode,
    sunEvents,
  );
}

function missionFlow(
  phase: AppPhase,
  seed: number,
  scenario: Scenario,
  mode: Mode,
  sunEvents: readonly SunEventRecord[],
) {
  const mission = createMissionState(
    seed,
    scenario,
    mode,
    sunEvents,
  );

  return {
    ...mission,
    appPhase: phase,
    selectedScenario: scenario,
    selectedMode: mode,
    missionSunEvents: sunEvents.map((event) => ({ ...event })),
    replayActions: [] as Action[],
    replayCursor: 0,
    inputError: '',
  };
}

function getLatestActionError(
  state: MissionState,
  fallback: string,
): string {
  const latestAction = state.actionLog.at(-1);

  if (latestAction?.status === 'rejected') {
    return latestAction.message || fallback;
  }

  return '';
}

function cloneSunEvents(
  events: readonly SunEventRecord[],
): SunEventRecord[] {
  return events.map((event) => ({ ...event }));
}

/* ================================================================
   GAME STORE
   ================================================================ */

export const useGameStore = create<GameState>((set) => ({
  /* --------------------------------------------------------------
     INITIAL STATE
     -------------------------------------------------------------- */

  ...missionFlow(
    'title',
    DEFAULT_SEED,
    DEFAULT_SCENARIO,
    DEFAULT_MODE,
    [],
  ),

  tickSpeed: 1,
  realSunMode: false,

  sunEvents: cloneSunEvents(BUNDLED_SUN_EVENTS),

  /* --------------------------------------------------------------
     NAVIGATION AND CONFIGURATION
     -------------------------------------------------------------- */

  goToSelect: () =>
    set({
      appPhase: 'select',
      inputError: '',
    }),

  chooseScenario: (scenario: Scenario) =>
    set({
      selectedScenario: scenario,
      inputError: '',
    }),

  chooseMode: (mode: Mode) =>
    set((state) => ({
      selectedMode: mode,

      ...(state.appPhase === 'design' ||
      state.appPhase === 'operate'
        ? { mode }
        : {}),

      inputError: '',
    })),

  /* --------------------------------------------------------------
     TUTORIAL
     -------------------------------------------------------------- */

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
      state.appPhase === 'tutorial'
        ? {
            appPhase: 'design',
            inputError: '',
          }
        : state,
    ),

  finishTutorial: () =>
    set((state) =>
      state.appPhase === 'tutorial'
        ? {
            appPhase: 'design',
            inputError: '',
          }
        : state,
    ),

  /* --------------------------------------------------------------
     MISSION INITIALIZATION
     -------------------------------------------------------------- */

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

  startOperations: () =>
    set((state) => {
      if (state.appPhase !== 'design') {
        return state;
      }

      return {
        appPhase: 'operate',
        isPaused: false,
        inputError: '',
      };
    }),

  /* --------------------------------------------------------------
     SIMULATION CONTROLS
     -------------------------------------------------------------- */

  setTickSpeed: (speed: TickSpeed) =>
    set({
      tickSpeed: speed,
    }),

  togglePause: () =>
    set((state) => {
      const cannotPause =
        state.gameOver ||
        state.missionResult?.success ||
        state.appPhase !== 'operate';

      if (cannotPause) {
        return state;
      }

      return {
        isPaused: !state.isPaused,
      };
    }),

  /* --------------------------------------------------------------
     REAL SUN EVENT CONFIGURATION
     -------------------------------------------------------------- */

  setRealSunMode: (enabled: boolean) =>
    set({
      realSunMode: enabled,
    }),

  setSunEvents: (events: SunEventRecord[]) =>
    set({
      sunEvents: cloneSunEvents(events),
    }),

  /* --------------------------------------------------------------
     REPLAY SYSTEM
     -------------------------------------------------------------- */

  loadReplay: (payload: ReplayPayload) =>
    set(() => {
      const replaySunEvents = payload.sunEvents ?? [];

      const missionEvents = payload.realSunMode
        ? replaySunEvents
        : [];

      const base = missionFlow(
        'operate',
        payload.seed,
        payload.scenario,
        payload.mode,
        missionEvents,
      );

      return {
        ...base,

        isPaused: false,
        tickSpeed: 5,

        realSunMode: payload.realSunMode ?? false,

        sunEvents: cloneSunEvents(replaySunEvents),

        missionSunEvents: payload.realSunMode
          ? cloneSunEvents(replaySunEvents)
          : [],

        replayActions: [...payload.actions],
        replayCursor: 0,
      };
    }),

  /* --------------------------------------------------------------
     ERROR HANDLING
     -------------------------------------------------------------- */

  setInputError: (message: string) =>
    set({
      inputError: message,
    }),

  /* --------------------------------------------------------------
     MODULE DEPLOYMENT
     -------------------------------------------------------------- */

  buildModule: (moduleId: string) =>
    set((state) => {
      if (state.appPhase !== 'design') {
        return {
          inputError:
            'Modules can only be deployed during the Design phase.',
        };
      }

      const nextState = applyAction(state, {
        day: state.daysPassed,
        type: 'deploy-module',
        payload: {
          moduleId,
        },
      });

      return {
        ...nextState,

        inputError: getLatestActionError(
          nextState,
          'Module deployment was rejected.',
        ),
      };
    }),

  /* --------------------------------------------------------------
     GENERAL ACTION DISPATCHER
     -------------------------------------------------------------- */

  dispatchAction: (action: Action) =>
    set((state) => {
      if (state.appPhase !== 'operate') {
        return {
          inputError:
            'This action is only available during operations.',
        };
      }

      const nextState = applyAction(state, action);

      return {
        ...nextState,

        inputError: getLatestActionError(
          nextState,
          'Action was rejected.',
        ),
      };
    }),

  /* --------------------------------------------------------------
     SIMULATION TICK
     -------------------------------------------------------------- */

  tick: () =>
    set((state) => {
      /* Prevent simulation outside active operations. */

      if (
        state.appPhase !== 'operate' ||
        state.isPaused ||
        state.gameOver ||
        state.missionResult?.success
      ) {
        return state;
      }

      /* ----------------------------------------------------------
         APPLY REPLAY ACTIONS FOR THE CURRENT DAY
         ---------------------------------------------------------- */

      let mission: MissionState = state;
      let replayCursor = state.replayCursor;

      while (
        replayCursor < state.replayActions.length &&
        state.replayActions[replayCursor].day ===
          mission.daysPassed
      ) {
        mission = applyAction(
          mission,
          state.replayActions[replayCursor],
        );

        replayCursor += 1;
      }

      /* ----------------------------------------------------------
         ADVANCE SIMULATION
         ---------------------------------------------------------- */

      const nextState = step(
        mission,
        mulberry32(state.seed),
      );

      const nextDay = nextState.daysPassed;

      /* ----------------------------------------------------------
         DETECT AUTOMATIC EVENT PAUSE
         ---------------------------------------------------------- */

      const pausedByEvent = nextState.events.some(
        (event) =>
          event.startDay === nextDay ||
          event.warningStartDay === nextDay,
      );

      /* ----------------------------------------------------------
         DETERMINE APPLICATION PHASE
         ---------------------------------------------------------- */

      const appPhase: AppPhase = nextState.gameOver
        ? 'debrief'
        : nextState.missionResult?.success
          ? 'result'
          : state.appPhase;

      /* ----------------------------------------------------------
         RETURN UPDATED STATE
         ---------------------------------------------------------- */

      return {
        ...nextState,

        appPhase,

        isPaused:
          nextState.gameOver ||
          nextState.missionResult?.success === true ||
          pausedByEvent,

        replayCursor,
      };
    }),
}));
