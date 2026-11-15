import {
  BASELINE_DAILY_CONSUMPTION,
  BASE_RESOURCE_CAPS,
  DEFAULT_MODE,
  DEFAULT_SCENARIO,
  DEFAULT_SEED,
  EVENT_SCHEDULE_HORIZON_DAYS,
  FAILURE_GRACE_DAYS,
  INITIAL_RESOURCES,
  MISSION_DURATION_DAYS,
  MORALE_FAILURE_THRESHOLD,
  MORALE_RECOVERY_PER_DAY,
  MORALE_STRESS_LOSS_PER_DAY,
  PASSIVE_DAILY_RADIATION_DOSE,
  RADIATION_FAILURE_THRESHOLD,
  RATION_CONSUMPTION_MULTIPLIERS,
  SHELTER_ORDER_DURATION_DAYS,
} from './constants';
import { createEventSchedule, getVisibleEvents, updateScheduledEvents } from './events';
import { AVAILABLE_MODULES } from './modules';
import { mulberry32 } from './rng';
import type {
  Action,
  ActionLog,
  CauseLog,
  GameEvent,
  MissionResult,
  MissionState,
  OutpostModule,
  ResourceKey,
  Resources,
  Scenario,
  Mode,
  StressDays,
  SunEventRecord,
} from './types';
import type { SeededRng } from './rng';

const STORED_RESOURCES = ['oxygen', 'water', 'food'] as const;
const MODULES_WITH_POWER_OUTPUT = new Set(['solar_panel', 'reactor']);

export function createInitialMissionState(
  seed = DEFAULT_SEED,
  scenario: Scenario = DEFAULT_SCENARIO,
  mode: Mode = DEFAULT_MODE,
  sunEvents: readonly SunEventRecord[] = [],
): MissionState {
  const rng = mulberry32(seed);
  const scheduledEvents = createEventSchedule(
    seed,
    scenario,
    rng,
    EVENT_SCHEDULE_HORIZON_DAYS,
    sunEvents,
  );

  return {
    seed,
    scenario,
    mode,
    daysPassed: 0,
    isPaused: true,
    gameOver: false,
    debriefReason: '',
    resources: { ...INITIAL_RESOURCES },
    resourceCaps: { ...BASE_RESOURCE_CAPS },
    builtModules: [],
    scheduledEvents,
    events: scheduledEvents.map((event) => ({ ...event })),
    activeEvents: [],
    shelterOrderedUntilDay: 0,
    rationLevel: RATION_CONSUMPTION_MULTIPLIERS.standard,
    stressDays: createStressDays(),
    actionLog: [],
    causeLog: [],
    logs: [`Mission initialized. Seed ${seed}; scenario ${scenario.toUpperCase()}.`],
  };
}

function createStressDays(): StressDays {
  return {
    power: 0,
    oxygen: 0,
    water: 0,
    food: 0,
    radiation: 0,
    morale: 0,
  };
}

function addCause(
  causes: CauseLog[],
  day: number,
  system: string,
  delta: number,
  reason: string,
  parentId?: string,
): string {
  const id = `cause-${causes.length + 1}`;
  causes.push({ id, day, system, delta, reason, ...(parentId ? { parentId } : {}) });
  return id;
}

function addActionLog(
  state: MissionState,
  action: Action,
  status: ActionLog['status'],
  message: string,
  nextState: Partial<MissionState> = {},
): MissionState {
  const id = `action-${state.actionLog.length + 1}`;
  const actionLog: ActionLog = { id, action, status, message };
  const causeLog = [...state.causeLog];
  addCause(
    causeLog,
    state.daysPassed,
    'action',
    status === 'applied' ? 1 : 0,
    message,
    status === 'applied' ? id : undefined,
  );

  return {
    ...state,
    ...nextState,
    actionLog: [...state.actionLog, actionLog],
    causeLog,
    logs: [...state.logs, `Day ${state.daysPassed} | ${status.toUpperCase()}: ${message}.`],
  };
}

export function applyAction(state: MissionState, action: Action): MissionState {
  if (state.gameOver || state.missionResult?.success) {
    return addActionLog(state, action, 'rejected', 'Mission is no longer accepting actions');
  }

  if (action.day !== state.daysPassed) {
    return addActionLog(state, action, 'rejected', 'Action day does not match the current mission day');
  }

  switch (action.type) {
    case 'deploy-module': {
      const template = AVAILABLE_MODULES.find((module) => module.id === action.payload.moduleId);
      if (!template) return addActionLog(state, action, 'rejected', 'Unknown module type');

      if (
        state.resources.massBudget < template.mass ||
        state.resources.creditBudget < template.costCredits
      ) {
        return addActionLog(state, action, 'rejected', `${template.name} exceeds the remaining design budget`);
      }

      const instanceNumber =
        state.builtModules.filter((module) => module.moduleType === template.moduleType).length + 1;
      const deployedModule: OutpostModule = {
        ...template,
        id: `${template.moduleType}-${instanceNumber}`,
        deployedDay: state.daysPassed,
      };
      const resources = {
        ...state.resources,
        massBudget: state.resources.massBudget - template.mass,
        creditBudget: state.resources.creditBudget - template.costCredits,
      };
      const resourceCaps = { ...state.resourceCaps };
      if (template.storageCapacity) {
        resourceCaps.power += template.storageCapacity;
      }

      return addActionLog(
        state,
        action,
        'applied',
        `Deployed ${template.name}; used ${template.mass} mass and ${template.costCredits} credits`,
        {
          builtModules: [...state.builtModules, deployedModule],
          resources,
          resourceCaps,
        },
      );
    }

    case 'repair-module': {
      const module = state.builtModules.find((item) => item.id === action.payload.moduleId);
      if (!module) return addActionLog(state, action, 'rejected', 'Cannot repair an unknown module');
      if ((module.offlineUntilDay ?? 0) <= state.daysPassed) {
        return addActionLog(state, action, 'rejected', `${module.name} is already operational`);
      }

      const builtModules = state.builtModules.map((item) =>
        item.id === module.id ? { ...item, offlineUntilDay: state.daysPassed } : item,
      );
      return addActionLog(state, action, 'applied', `Repaired ${module.name}`, { builtModules });
    }

    case 'order-shelter': {
      if (!state.builtModules.some((module) => module.moduleType === 'storm_shelter')) {
        return addActionLog(state, action, 'rejected', 'No storm shelter is available');
      }
      const shelterOrderedUntilDay = Math.max(
        state.shelterOrderedUntilDay,
        state.daysPassed + SHELTER_ORDER_DURATION_DAYS,
      );
      return addActionLog(
        state,
        action,
        'applied',
        `Crew ordered into shelter through Day ${shelterOrderedUntilDay}`,
        { shelterOrderedUntilDay },
      );
    }

    case 'set-ration-level': {
      const validLevels = Object.values(RATION_CONSUMPTION_MULTIPLIERS);
      if (!Number.isFinite(action.payload.level) || !validLevels.includes(action.payload.level as 0.6 | 1 | 1.25)) {
        return addActionLog(state, action, 'rejected', 'Ration level must be emergency, standard, or generous');
      }
      return addActionLog(state, action, 'applied', `Ration level set to ${action.payload.level}`, {
        rationLevel: action.payload.level,
      });
    }

    case 'set-power-priority': {
      const module = state.builtModules.find((item) => item.id === action.payload.moduleId);
      if (!module || !Number.isSafeInteger(action.payload.priority) || action.payload.priority < 0) {
        return addActionLog(state, action, 'rejected', 'Power priority requires a module and non-negative integer');
      }
      const builtModules = state.builtModules.map((item) =>
        item.id === module.id ? { ...item, powerPriority: action.payload.priority } : item,
      );
      return addActionLog(
        state,
        action,
        'applied',
        `${module.name} power priority set to ${action.payload.priority}`,
        { builtModules },
      );
    }
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function addResource(
  resources: Resources,
  resourceCaps: MissionState['resourceCaps'],
  key: ResourceKey,
  delta: number,
): number {
  const updated = clamp(resources[key] + delta, 0, resourceCaps[key]);
  resources[key] = updated;
  return updated;
}

function isOperational(module: OutpostModule, day: number): boolean {
  return (module.offlineUntilDay ?? 0) <= day;
}

function pushResourceCause(
  resources: Resources,
  resourceCaps: MissionState['resourceCaps'],
  causes: CauseLog[],
  day: number,
  key: ResourceKey,
  delta: number,
  reason: string,
  parentId?: string,
): string {
  const previous = resources[key];
  const current = addResource(resources, resourceCaps, key, delta);
  return addCause(causes, day, key, current - previous, reason, parentId);
}

function createMissionResult(
  state: MissionState,
  day: number,
  success: boolean,
  failureReason: string,
  actionLog: ActionLog[],
  causeLog: CauseLog[],
): MissionResult {
  return {
    seed: state.seed,
    scenario: state.scenario,
    mode: state.mode,
    daysSurvived: day,
    success,
    failureReason,
    actionLog,
    causeLog,
  };
}

/**
 * Advances one deterministic in-game day without mutating state or the RNG.
 * The indexable random stream only varies the dose from an already scheduled
 * particle event; event dates and durations are created at mission start.
 */
export function step(state: MissionState, rng: SeededRng): MissionState {
  if (state.gameOver || state.missionResult?.success) return state;

  const day = state.daysPassed + 1;
  const events = updateScheduledEvents(state.scheduledEvents, day);
  const activeEvents = getVisibleEvents(events);
  const causeLog = [...state.causeLog];
  const dailyLogs: string[] = [];
  const eventCauseIds = new Map<string, string>();
  const resources = { ...state.resources };
  const builtModules = state.builtModules.map((module) => ({ ...module }));
  const eventCauseId = (event: GameEvent): string | undefined =>
    eventCauseIds.get(event.id) ??
    causeLog.find(
      (cause) =>
        cause.system === 'event' &&
        cause.reason === `${event.name} began (${event.id})`,
    )?.id;

  for (const event of events) {
    if (event.warningStartDay === day) {
      dailyLogs.push(`Day ${day} | WARNING: ${event.name} warning received.`);
      const id = addCause(
        causeLog,
        day,
        'event',
        1,
        `${event.name} warning received (${event.id})`,
      );
      eventCauseIds.set(event.id, id);
    }

    if (event.startDay === day) {
      dailyLogs.push(`Day ${day} | EVENT: ${event.name} began.`);
      const id = addCause(
        causeLog,
        day,
        'event',
        1,
        `${event.name} began (${event.id})`,
        eventCauseId(event),
      );
      eventCauseIds.set(event.id, id);

      if (event.type === 'equipment-failure' && event.targetModuleType) {
        const affected = builtModules.filter(
          (module) => module.moduleType === event.targetModuleType,
        );
        for (const module of affected) {
          module.offlineUntilDay = day + event.durationDays;
          addCause(
            causeLog,
            day,
            'equipment',
            -1,
            `${module.name} offline until Day ${module.offlineUntilDay}`,
            id,
          );
        }
        dailyLogs.push(
          affected.length > 0
            ? `Day ${day} | EQUIPMENT: ${affected.map((module) => module.name).join(', ')} offline.`
            : `Day ${day} | EQUIPMENT: No ${event.targetModuleType} installed; no module affected.`,
        );
      }
    }
  }

  for (const previousEvent of state.events) {
    const updated = events.find((event) => event.id === previousEvent.id);
    if (previousEvent.active && updated && !updated.active) {
      dailyLogs.push(`Day ${day} | EVENT CLEARED: ${previousEvent.name}.`);
    }
  }

  const dustStorms = events.filter((event) => event.type === 'dust-storm' && event.active);
  const lunarNightActive = events.some((event) => event.type === 'lunar-night' && event.active);
  const particleEvents = events.filter(
    (event) => event.type === 'solar-particle-event' && event.active,
  );
  const operationalModules = builtModules.filter((module) => isOperational(module, day));
  const solarMultiplier = lunarNightActive
    ? 0
    : dustStorms.reduce(
        (multiplier, event) => multiplier * (1 - (event.solarReduction ?? 0)),
        1,
      );

  const solarGeneration = operationalModules
    .filter((module) => module.moduleType === 'solar_panel')
    .reduce((sum, module) => sum + module.powerProduced * solarMultiplier, 0);
  const reactorGeneration = operationalModules
    .filter((module) => module.moduleType === 'reactor')
    .reduce((sum, module) => sum + module.powerProduced, 0);
  let availablePower = Math.max(
    0,
    resources.power + solarGeneration + reactorGeneration - BASELINE_DAILY_CONSUMPTION.power,
  );
  const powerEventId = dustStorms.length > 0
    ? eventCauseId(dustStorms[0])
    : lunarNightActive
      ? (() => {
          const lunarNight = events.find(
            (event) => event.type === 'lunar-night' && event.active,
          );
          return lunarNight ? eventCauseId(lunarNight) : undefined;
        })()
      : undefined;

  const rationMultiplier = state.rationLevel;
  for (const resource of STORED_RESOURCES) {
    const multiplier = resource === 'oxygen' ? 1 : rationMultiplier;
    pushResourceCause(
      resources,
      state.resourceCaps,
      causeLog,
      day,
      resource,
      -BASELINE_DAILY_CONSUMPTION[resource] * multiplier,
      `Crew ${resource} consumption`,
    );
  }

  const consumers = operationalModules
    .filter((module) => !MODULES_WITH_POWER_OUTPUT.has(module.moduleType))
    .slice()
    .sort(
      (left, right) =>
        left.powerPriority - right.powerPriority || left.id.localeCompare(right.id),
    );
  let moraleFromModules = 0;

  for (const module of consumers) {
    const requiredInputs = Object.entries(module.inputs) as [ResourceKey, number][];
    const missingInput = requiredInputs.find(([key, amount]) => resources[key] < amount);
    if (missingInput) {
      dailyLogs.push(
        `Day ${day} | STARVED: ${module.name} needs ${missingInput[1]} ${missingInput[0]}.`,
      );
      addCause(
        causeLog,
        day,
        module.moduleType,
        0,
        `${module.name} could not operate: ${missingInput[0]} input depleted`,
      );
      continue;
    }

    if (module.powerConsumed > availablePower) {
      dailyLogs.push(`Day ${day} | POWER: ${module.name} throttled; insufficient stored power.`);
      addCause(
        causeLog,
        day,
        module.moduleType,
        0,
        `${module.name} throttled by insufficient power`,
        powerEventId,
      );
      continue;
    }

    availablePower -= module.powerConsumed;
    for (const [key, amount] of requiredInputs) {
      pushResourceCause(
        resources,
        state.resourceCaps,
        causeLog,
        day,
        key,
        -amount,
        `${module.name} input`,
      );
    }
    for (const [key, amount] of Object.entries(module.outputs) as [ResourceKey, number][]) {
      if (key === 'power') continue;
      pushResourceCause(
        resources,
        state.resourceCaps,
        causeLog,
        day,
        key,
        amount,
        `${module.name} production`,
      );
      if (key === 'morale') moraleFromModules += amount;
    }
  }

  const powerAfterConsumption = Math.min(state.resourceCaps.power, availablePower);
  const powerDelta = powerAfterConsumption - state.resources.power;
  resources.power = powerAfterConsumption;
  const powerCauseId = addCause(
    causeLog,
    day,
    'power',
    powerDelta,
    `Generation ${solarGeneration.toFixed(1)} solar + ${reactorGeneration.toFixed(1)} reactor; baseline load ${BASELINE_DAILY_CONSUMPTION.power} and module loads`,
    powerEventId,
  );
  if (resources.power === 0) {
    dailyLogs.push(`Day ${day} | WARNING: Stored power depleted; life-support reserve is exhausted.`);
  }

  const regolithLayers = operationalModules.filter(
    (module) => module.moduleType === 'regolith_shield',
  );
  const shieldFactor = regolithLayers.reduce(
    (factor, module) => factor * (1 - (module.radiationProtection ?? 0)),
    1,
  );
  const shelterOrdered = day <= state.shelterOrderedUntilDay;
  const shelterFactor = shelterOrdered
    ? operationalModules
        .filter((module) => module.moduleType === 'storm_shelter')
        .reduce((factor, module) => factor * (1 - (module.radiationProtection ?? 0)), 1)
    : 1;
  const doseVariation = 0.9 + rng(1000 + day) * 0.2;
  const particleDose = particleEvents.reduce(
    (sum, event) => sum + (event.radiationDosePerDay ?? 0),
    0,
  );
  const radiationDelta =
    (PASSIVE_DAILY_RADIATION_DOSE + particleDose * doseVariation) *
    shieldFactor *
    shelterFactor;
  const radiationCauseId = pushResourceCause(
    resources,
    state.resourceCaps,
    causeLog,
    day,
    'radiationDose',
    radiationDelta,
    particleDose > 0
      ? `Particle-event dose ${particleDose.toFixed(1)} before shielding`
      : 'Game-scaled background exposure',
    particleEvents.length > 0 ? eventCauseId(particleEvents[0]) : undefined,
  );

  const essentialsAvailable =
    resources.oxygen > 0 &&
    resources.water > 0 &&
    resources.food > 0 &&
    resources.power > 0;
  const moraleDelta =
    (essentialsAvailable ? MORALE_RECOVERY_PER_DAY : -MORALE_STRESS_LOSS_PER_DAY) +
    moraleFromModules;
  pushResourceCause(
    resources,
    state.resourceCaps,
    causeLog,
    day,
    'morale',
    moraleDelta,
    essentialsAvailable ? 'Crew morale recovery and habitat support' : 'Crew morale stress from depleted life support',
    essentialsAvailable ? undefined : powerCauseId,
  );

  const stressDays: StressDays = {
    power: resources.power === 0 ? state.stressDays.power + 1 : 0,
    oxygen: resources.oxygen === 0 ? state.stressDays.oxygen + 1 : 0,
    water: resources.water === 0 ? state.stressDays.water + 1 : 0,
    food: resources.food === 0 ? state.stressDays.food + 1 : 0,
    radiation:
      resources.radiationDose >= RADIATION_FAILURE_THRESHOLD
        ? state.stressDays.radiation + 1
        : 0,
    morale:
      resources.morale <= MORALE_FAILURE_THRESHOLD ? state.stressDays.morale + 1 : 0,
  };

  const failureReason = getFailureReason(stressDays);
  if (failureReason) {
    const failedSystem = failureReason.split(' ')[0].toLowerCase();
    const triggeringCause = causeLog.findLast(
      (cause) =>
        cause.day === day &&
        cause.system === (failedSystem === 'radiation' ? 'radiationDose' : failedSystem),
    );
    addCause(
      causeLog,
      day,
      'mission',
      -1,
      failureReason,
      triggeringCause?.id ??
        (failedSystem === 'radiation'
          ? radiationCauseId
          : failedSystem === 'power'
            ? powerCauseId
            : undefined),
    );
    dailyLogs.push(`Day ${day} | CRITICAL: ${failureReason}.`);
  }

  dailyLogs.push(
    `Day ${day} | STATUS: O₂ ${resources.oxygen.toFixed(1)} · PWR ${resources.power.toFixed(1)} · H₂O ${resources.water.toFixed(1)} · FOOD ${resources.food.toFixed(1)} · RAD ${resources.radiationDose.toFixed(1)} · MORALE ${resources.morale.toFixed(1)}.`,
  );

  const actionLog = state.actionLog;
  const gameOver = failureReason.length > 0;
  const missionSuccess = !gameOver && day >= MISSION_DURATION_DAYS;
  const missionResult =
    gameOver || missionSuccess
      ? createMissionResult(
          state,
          day,
          missionSuccess,
          failureReason,
          actionLog,
          causeLog,
        )
      : undefined;

  return {
    ...state,
    daysPassed: day,
    isPaused: gameOver || missionSuccess ? true : state.isPaused,
    gameOver,
    debriefReason: failureReason,
    resources,
    builtModules,
    events,
    activeEvents,
    stressDays,
    causeLog,
    logs: [...state.logs, ...dailyLogs].slice(-500),
    ...(missionResult ? { missionResult } : {}),
  };
}

export function forecastMission(state: MissionState): {
  days: number;
  survives: boolean;
  reason: string;
} {
  let forecast = {
    ...state,
    isPaused: false,
    actionLog: [...state.actionLog],
    causeLog: [...state.causeLog],
    logs: [...state.logs],
    events: state.scheduledEvents.map((event) => ({ ...event })),
    builtModules: state.builtModules.map((module) => ({ ...module })),
  };
  const rng = mulberry32(state.seed);
  const hasShelter = forecast.builtModules.some(
    (module) => module.moduleType === 'storm_shelter',
  );

  while (forecast.daysPassed < MISSION_DURATION_DAYS && !forecast.gameOver) {
    if (hasShelter) {
      const particleWarning = forecast.events.some(
        (event) => event.type === 'solar-particle-event' && event.warned,
      );
      if (particleWarning && forecast.shelterOrderedUntilDay < forecast.daysPassed + 1) {
        forecast = applyAction(forecast, {
          day: forecast.daysPassed,
          type: 'order-shelter',
          payload: {},
        });
      }
    }
    forecast = step(forecast, rng);
  }

  return {
    days: forecast.daysPassed,
    survives: forecast.missionResult?.success === true,
    reason: forecast.debriefReason,
  };
}

function getFailureReason(stressDays: StressDays): string {
  const failures: string[] = [];
  if (stressDays.power >= FAILURE_GRACE_DAYS.power) {
    failures.push('Power for life support depleted beyond its grace period');
  }
  if (stressDays.oxygen >= FAILURE_GRACE_DAYS.oxygen) {
    failures.push('Oxygen depleted beyond its grace period');
  }
  if (stressDays.water >= FAILURE_GRACE_DAYS.water) {
    failures.push('Water depleted beyond its grace period');
  }
  if (stressDays.food >= FAILURE_GRACE_DAYS.food) {
    failures.push('Food depleted beyond its grace period');
  }
  if (stressDays.radiation >= FAILURE_GRACE_DAYS.radiation) {
    failures.push('Radiation dose exceeded the mission limit');
  }
  if (stressDays.morale >= FAILURE_GRACE_DAYS.morale) {
    failures.push('Crew morale collapsed');
  }
  return failures.join('; ');
}