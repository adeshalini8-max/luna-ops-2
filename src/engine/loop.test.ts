import { describe, expect, it } from 'vitest';
import { createEventSchedule } from './events';
import { applyAction, createInitialMissionState, step } from './loop';
import { mulberry32 } from './rng';
import type { MissionState, Scenario } from './types';

const BALANCED_MODULES = [
  'solar_panel',
  'reactor',
  'battery',
  'o2_generator',
  'water_reclaimer',
  'greenhouse',
  'regolith_shield',
  'storm_shelter',
  'habitat',
];

function deployModules(state: MissionState, moduleIds: readonly string[]): MissionState {
  return moduleIds.reduce(
    (current, moduleId) =>
      applyAction(current, {
        day: current.daysPassed,
        type: 'deploy-module',
        payload: { moduleId },
      }),
    state,
  );
}

function runBalancedBot(scenario: Scenario): MissionState {
  const seed = 481516;
  const rng = mulberry32(seed);
  let state = deployModules(
    createInitialMissionState(seed, scenario, 'engineer'),
    BALANCED_MODULES,
  );

  while (state.daysPassed < 30 && !state.gameOver) {
    const particleWarning = state.events.find(
      (event) => event.type === 'solar-particle-event' && event.warned,
    );
    if (
      particleWarning &&
      state.shelterOrderedUntilDay < state.daysPassed + 1
    ) {
      state = applyAction(state, {
        day: state.daysPassed,
        type: 'order-shelter',
        payload: {},
      });
    }

    state = step(state, rng);
  }

  return state;
}

function advanceToDay(state: MissionState, targetDay: number): MissionState {
  const rng = mulberry32(state.seed);
  let current = state;
  while (current.daysPassed < targetDay && !current.gameOver) {
    current = step(current, rng);
  }
  return current;
}

describe('pure deterministic mission engine', () => {
  it('replays the same seed and actions to an identical state', () => {
    const seed = 217;
    const run = () => {
      const rng = mulberry32(seed);
      let state = deployModules(
        createInitialMissionState(seed, 'mars', 'cadet'),
        BALANCED_MODULES,
      );
      while (state.daysPassed < 30 && !state.gameOver) {
        const warning = state.events.find(
          (event) => event.type === 'solar-particle-event' && event.warned,
        );
        if (warning && state.shelterOrderedUntilDay < state.daysPassed + 1) {
          state = applyAction(state, {
            day: state.daysPassed,
            type: 'order-shelter',
            payload: {},
          });
        }
        state = step(state, rng);
      }
      return state;
    };

    expect(run()).toEqual(run());
  });

  it('does not mutate the input state while advancing one day', () => {
    const state = createInitialMissionState(121, 'mars', 'cadet');
    const before = JSON.stringify(state);

    step(state, mulberry32(state.seed));

    expect(JSON.stringify(state)).toBe(before);
  });

  it('pre-schedules repeatable, scenario-appropriate events from the seed', () => {
    const marsA = createEventSchedule(42, 'mars');
    const marsB = createEventSchedule(42, 'mars');
    const moon = createEventSchedule(42, 'moon');

    expect(marsA).toEqual(marsB);
    expect(marsA.some((event) => event.type === 'dust-storm')).toBe(true);
    expect(marsA.some((event) => event.type === 'lunar-night')).toBe(false);
    expect(moon.some((event) => event.type === 'lunar-night')).toBe(true);
    expect(moon.some((event) => event.type === 'dust-storm')).toBe(false);

    for (const storm of marsA.filter((event) => event.type === 'dust-storm')) {
      expect(storm.durationDays).toBeGreaterThanOrEqual(3);
      expect(storm.durationDays).toBeLessThanOrEqual(10);
      expect(storm.solarReduction).toBeGreaterThanOrEqual(0.6);
      expect(storm.solarReduction).toBeLessThanOrEqual(0.9);
    }
    for (const particleEvent of [...marsA, ...moon].filter(
      (event) => event.type === 'solar-particle-event',
    )) {
      expect(particleEvent.warningStartDay).toBeLessThan(particleEvent.startDay);
      expect(particleEvent.startDay - (particleEvent.warningStartDay ?? 0)).toBeGreaterThanOrEqual(1);
      expect(particleEvent.startDay - (particleEvent.warningStartDay ?? 0)).toBeLessThanOrEqual(2);
    }
  });

  it('schedules historical Sun records reproducibly with their source date and SEP label', () => {
    const sunEvent = {
      id: '2024-01-02T23:22:00-SEP-002',
      eventDate: '2024-01-02',
      eventClass: 'SEP',
      link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/28445/-1',
      source: 'bundled' as const,
    };
    const first = createInitialMissionState(729, 'mars', 'cadet', [sunEvent]);
    const second = createInitialMissionState(729, 'mars', 'cadet', [sunEvent]);
    const scheduled = first.scheduledEvents.find(
      (event) => event.type === 'solar-particle-event',
    );

    expect(second.scheduledEvents).toEqual(first.scheduledEvents);
    expect(scheduled).toMatchObject({
      sourceDate: '2024-01-02',
      eventClass: 'SEP',
      name: 'Solar Particle Event · SEP',
    });
  });

  it('fails an idle base after resource depletion', () => {
    let state = createInitialMissionState(3, 'mars', 'cadet');
    while (state.daysPassed < 30 && !state.gameOver) {
      state = step(state, mulberry32(state.seed));
    }

    expect(state.gameOver).toBe(true);
    expect(state.missionResult?.success).toBe(false);
    expect(state.debriefReason.length).toBeGreaterThan(0);
    expect(state.causeLog.some((cause) => cause.system === 'mission')).toBe(true);
  });

  it('fails an all-solar outpost without storage during the lunar night', () => {
    const seed = 311;
    let state = deployModules(
      createInitialMissionState(seed, 'moon', 'engineer'),
      ['solar_panel', 'o2_generator', 'water_reclaimer', 'greenhouse'],
    );
    const rng = mulberry32(seed);

    while (state.daysPassed < 30 && !state.gameOver) {
      state = step(state, rng);
    }

    expect(state.events.some((event) => event.type === 'lunar-night' && event.active)).toBe(
      true,
    );
    expect(state.gameOver).toBe(true);
    expect(state.debriefReason).toContain('Power for life support');
  });

  it('fails an unshielded outpost during the scheduled particle event', () => {
    const seed = 91;
    let state = deployModules(
      createInitialMissionState(seed, 'mars', 'engineer'),
      ['solar_panel', 'reactor', 'o2_generator', 'water_reclaimer', 'greenhouse'],
    );
    const particleEvent = state.scheduledEvents.find(
      (event) => event.type === 'solar-particle-event',
    );
    state = advanceToDay(state, (particleEvent?.startDay ?? 15) + 2);

    expect(state.gameOver).toBe(true);
    expect(state.debriefReason).toContain('Radiation dose');
    const radiationCause = state.causeLog.find(
      (cause) => cause.system === 'radiationDose' && cause.parentId,
    );
    expect(radiationCause).toBeDefined();
    expect(
      state.causeLog.some(
        (cause) =>
          cause.system === 'event' &&
          cause.reason.startsWith('Solar Particle Event began (') &&
          cause.id === radiationCause?.parentId,
      ),
    ).toBe(true);
  });

  it('takes scheduled failed equipment offline and allows a logged repair', () => {
    const seed = 193;
    const rng = mulberry32(seed);
    let state = deployModules(
      createInitialMissionState(seed, 'mars', 'engineer'),
      BALANCED_MODULES,
    );
    const failureEvent = state.scheduledEvents.find(
      (event) => event.type === 'equipment-failure',
    );
    const targetModule = state.builtModules.find(
      (module) => module.moduleType === failureEvent?.targetModuleType,
    );
    expect(failureEvent).toBeDefined();
    expect(targetModule).toBeDefined();

    while (
      state.daysPassed < (failureEvent?.startDay ?? 30) &&
      !state.gameOver
    ) {
      const warning = state.events.find(
        (event) => event.type === 'solar-particle-event' && event.warned,
      );
      if (warning && state.shelterOrderedUntilDay < state.daysPassed + 1) {
        state = applyAction(state, {
          day: state.daysPassed,
          type: 'order-shelter',
          payload: {},
        });
      }
      state = step(state, rng);
    }

    const failedModule = state.builtModules.find(
      (module) => module.id === targetModule?.id,
    );
    expect(failedModule?.offlineUntilDay).toBeGreaterThan(state.daysPassed);

    state = applyAction(state, {
      day: state.daysPassed,
      type: 'repair-module',
      payload: { moduleId: targetModule?.id ?? '' },
    });

    expect(state.actionLog.at(-1)?.status).toBe('applied');
    expect(
      state.builtModules.find((module) => module.id === targetModule?.id)
        ?.offlineUntilDay,
    ).toBe(state.daysPassed);
  });

  it.each<Scenario>(['moon', 'mars'])(
    'keeps the balanced %s bot alive through the 30-day objective',
    (scenario) => {
      const state = runBalancedBot(scenario);

      expect(state.daysPassed).toBe(30);
      expect(state.gameOver).toBe(false);
      expect(state.missionResult?.success).toBe(true);
      expect(state.missionResult?.daysSurvived).toBe(30);
    },
  );

  it('keeps resources finite and non-negative through a full balanced replay', () => {
    const seed = 773;
    const rng = mulberry32(seed);
    let state = deployModules(
      createInitialMissionState(seed, 'mars', 'engineer'),
      BALANCED_MODULES,
    );

    while (state.daysPassed < 30 && !state.gameOver) {
      const warning = state.events.find(
        (event) => event.type === 'solar-particle-event' && event.warned,
      );
      if (warning && state.shelterOrderedUntilDay < state.daysPassed + 1) {
        state = applyAction(state, {
          day: state.daysPassed,
          type: 'order-shelter',
          payload: {},
        });
      }

      state = step(state, rng);
      for (const [resource, value] of Object.entries(state.resources)) {
        expect(Number.isFinite(value), `${resource} should remain finite`).toBe(true);
        expect(value, `${resource} should not become negative`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('rejects unaffordable construction without mutating mission resources', () => {
    const state = createInitialMissionState(9, 'mars', 'cadet');
    const underfunded = {
      ...state,
      resources: { ...state.resources, massBudget: 0 },
    };
    const next = applyAction(underfunded, {
      day: 0,
      type: 'deploy-module',
      payload: { moduleId: 'reactor' },
    });

    expect(next.builtModules).toEqual([]);
    expect(next.resources.massBudget).toBe(0);
    expect(next.actionLog.at(-1)?.status).toBe('rejected');
  });
});
