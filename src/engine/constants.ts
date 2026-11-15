import type { Mode, Resources, ResourceCaps, Scenario, StressDays } from './types';

/**
 * All gameplay quantities here are game-scaled tuning values, not NASA vehicle
 * design data. They are intentionally tuned for readable trade-offs and the
 * deterministic survival/failure test scenarios; science notes identify them
 * as illustrative rather than operational recommendations.
 */
export const DEFAULT_SEED = 2026;
export const DEFAULT_SCENARIO: Scenario = 'mars';
export const DEFAULT_MODE: Mode = 'cadet';
export const MISSION_DURATION_DAYS = 30;
export const EVENT_SCHEDULE_HORIZON_DAYS = 90;
export const RADIATION_FAILURE_THRESHOLD = 45;

export const INITIAL_RESOURCES: Resources = {
  power: 100,
  oxygen: 60,
  water: 60,
  food: 60,
  radiationDose: 0,
  morale: 80,
  massBudget: 1000,
  creditBudget: 1800,
};

export const BASE_RESOURCE_CAPS: ResourceCaps = {
  power: 100,
  oxygen: 120,
  water: 120,
  food: 120,
  radiationDose: RADIATION_FAILURE_THRESHOLD,
  morale: 100,
  massBudget: INITIAL_RESOURCES.massBudget,
  creditBudget: INITIAL_RESOURCES.creditBudget,
};

export const BASELINE_DAILY_CONSUMPTION = {
  oxygen: 4,
  water: 4,
  food: 4,
  power: 8,
} as const;

export const PASSIVE_DAILY_RADIATION_DOSE = 0.1;
export const MORALE_FAILURE_THRESHOLD = 15;
export const MORALE_RECOVERY_PER_DAY = 1;
export const MORALE_STRESS_LOSS_PER_DAY = 8;
export const SHELTER_ORDER_DURATION_DAYS = 3;

export const FAILURE_GRACE_DAYS = {
  power: 2,
  oxygen: 2,
  water: 3,
  food: 3,
  radiation: 1,
  morale: 3,
} satisfies StressDays;

export const RATION_CONSUMPTION_MULTIPLIERS = {
  emergency: 0.6,
  standard: 1,
  generous: 1.25,
} as const;