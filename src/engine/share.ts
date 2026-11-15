import type {
  Action,
  Mode,
  ReplayPayload,
  Scenario,
  SunEventRecord,
} from './types';

const MODULE_IDS = new Set([
  'solar_panel',
  'reactor',
  'battery',
  'o2_generator',
  'water_reclaimer',
  'greenhouse',
  'regolith_shield',
  'storm_shelter',
  'habitat',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSunEvent(value: unknown): value is SunEventRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.eventDate === 'string' &&
    typeof value.eventClass === 'string' &&
    typeof value.link === 'string' &&
    (value.source === 'nasa-donki' || value.source === 'bundled')
  );
}

function isAction(value: unknown): value is Action {
  if (
    !isRecord(value) ||
    !Number.isSafeInteger(value.day) ||
    typeof value.type !== 'string' ||
    !isRecord(value.payload)
  ) {
    return false;
  }

  const { payload } = value;
  switch (value.type) {
    case 'deploy-module':
      return typeof payload.moduleId === 'string' && MODULE_IDS.has(payload.moduleId);
    case 'repair-module':
      return typeof payload.moduleId === 'string';
    case 'order-shelter':
      return Object.keys(payload).length === 0;
    case 'set-ration-level':
      return typeof payload.level === 'number' && [0.6, 1, 1.25].includes(payload.level);
    case 'set-power-priority':
      return (
        typeof payload.moduleId === 'string' &&
        Number.isSafeInteger(payload.priority) &&
        Number(payload.priority) >= 0
      );
    default:
      return false;
  }
}

function isReplayPayload(value: unknown): value is ReplayPayload {
  return (
    isRecord(value) &&
    value.version === 1 &&
    Number.isSafeInteger(value.seed) &&
    (value.scenario === 'moon' || value.scenario === 'mars') &&
    (value.mode === 'cadet' || value.mode === 'engineer') &&
    Array.isArray(value.actions) &&
    value.actions.every(isAction) &&
    value.actions.every((action, index, actions) => {
      const current = action as Action;
      const previous = actions[index - 1] as Action | undefined;
      return (
        current.day >= 0 &&
        current.day <= 90 &&
        (previous === undefined || current.day >= previous.day)
      );
    }) &&
    (value.sunEvents === undefined ||
      (Array.isArray(value.sunEvents) && value.sunEvents.every(isSunEvent))) &&
    (value.realSunMode === undefined || typeof value.realSunMode === 'boolean')
  );
}

export function encodeReplayPayload(payload: ReplayPayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

export function decodeReplayPayload(encoded: string): ReplayPayload {
  if (!/^[\w-]+$/u.test(encoded) || encoded.length > 100_000) {
    throw new Error('The replay link is malformed or too large.');
  }

  let value: unknown;
  try {
    const base64 = encoded.replaceAll('-', '+').replaceAll('_', '/');
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    value = JSON.parse(new TextDecoder().decode(bytes));
  } catch (error) {
    throw new Error('The replay link could not be decoded.', { cause: error });
  }

  if (!isReplayPayload(value)) {
    throw new Error('Replay data is missing required fields or contains invalid actions.');
  }

  return value;
}

export function createReplayPayload(
  seed: number,
  scenario: Scenario,
  mode: Mode,
  actions: Action[],
  options: Pick<ReplayPayload, 'sunEvents' | 'realSunMode'> = {},
): ReplayPayload {
  return { version: 1, seed, scenario, mode, actions, ...options };
}
