import type { Mode, Scenario } from '../engine/types';

const SETTINGS_KEY = 'outpost-zero-settings';
const BEST_SCORE_KEY = 'outpost-zero-best';

export interface LocalSettings {
  scenario: Scenario;
  mode: Mode;
  realSunMode: boolean;
  soundEnabled: boolean;
  briefingEnabled: boolean;
  tutorialSeen: boolean;
}

export interface BestRun {
  days: number;
  score: number;
}

export const DEFAULT_LOCAL_SETTINGS: LocalSettings = {
  scenario: 'mars',
  mode: 'cadet',
  realSunMode: false,
  soundEnabled: false,
  briefingEnabled: true,
  tutorialSeen: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function loadLocalSettings(): {
  settings: LocalSettings;
  warning: string;
} {
  try {
    const stored = window.localStorage.getItem(SETTINGS_KEY);
    if (!stored) return { settings: DEFAULT_LOCAL_SETTINGS, warning: '' };
    const value: unknown = JSON.parse(stored);
    if (!isRecord(value)) {
      return {
        settings: DEFAULT_LOCAL_SETTINGS,
        warning: 'Saved settings were invalid and have been reset.',
      };
    }

    return {
      settings: {
        scenario: value.scenario === 'moon' ? 'moon' : 'mars',
        mode: value.mode === 'engineer' ? 'engineer' : 'cadet',
        realSunMode: value.realSunMode === true,
        soundEnabled: value.soundEnabled === true,
        briefingEnabled: value.briefingEnabled !== false,
        tutorialSeen: value.tutorialSeen === true,
      },
      warning: '',
    };
  } catch {
    return {
      settings: DEFAULT_LOCAL_SETTINGS,
      warning: 'Browser storage is unavailable; settings will not persist.',
    };
  }
}

export function saveLocalSettings(settings: LocalSettings): string {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return '';
  } catch {
    return 'Browser storage is unavailable; settings were not saved.';
  }
}

export function loadBestRun(): BestRun | null {
  try {
    const stored = window.localStorage.getItem(BEST_SCORE_KEY);
    if (!stored) return null;
    const value: unknown = JSON.parse(stored);
    if (
      isRecord(value) &&
      typeof value.days === 'number' &&
      Number.isFinite(value.days) &&
      typeof value.score === 'number' &&
      Number.isFinite(value.score)
    ) {
      return { days: value.days, score: value.score };
    }
  } catch {
    return null;
  }
  return null;
}

export function saveBestRun(run: BestRun): string {
  try {
    const previous = loadBestRun();
    if (previous && previous.days >= run.days && previous.score >= run.score) return '';
    window.localStorage.setItem(BEST_SCORE_KEY, JSON.stringify(run));
    return '';
  } catch {
    return 'Browser storage is unavailable; the best run was not saved.';
  }
}
