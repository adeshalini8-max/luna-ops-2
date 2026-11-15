import { BUNDLED_SUN_EVENTS } from '../data/sunEvents';
import type { SunEventRecord } from '../engine/types';

const REQUEST_TIMEOUT_MS = 4_000;
const DONKI_SEP_ENDPOINT = 'https://api.nasa.gov/DONKI/SEP';
const DAY_IN_MS = 24 * 60 * 60 * 1_000;

export interface SunEventLoadResult {
  events: SunEventRecord[];
  source: 'nasa-donki' | 'bundled';
  warning: string;
}

interface DonkiSepRecord {
  sepID: string;
  eventTime: string;
  link: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseDonkiRecords(value: unknown): SunEventRecord[] {
  if (!Array.isArray(value)) {
    throw new Error('NASA DONKI returned an unexpected response shape.');
  }
  const parsed = value.map((entry, index): DonkiSepRecord => {
    if (
      !isRecord(entry) ||
      typeof entry.sepID !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T.+-SEP-\d{3}$/u.test(entry.sepID) ||
      typeof entry.eventTime !== 'string' ||
      !Number.isFinite(Date.parse(entry.eventTime)) ||
      typeof entry.link !== 'string'
    ) {
      throw new Error(`NASA DONKI SEP record ${index + 1} is malformed.`);
    }

    let eventUrl: URL;
    try {
      eventUrl = new URL(entry.link);
    } catch (error) {
      throw new Error(`NASA DONKI SEP record ${index + 1} has an invalid link.`, { cause: error });
    }
    if (eventUrl.protocol !== 'https:' || !eventUrl.hostname.endsWith('.nasa.gov')) {
      throw new Error(`NASA DONKI SEP record ${index + 1} has a non-NASA link.`);
    }
    return {
      sepID: entry.sepID,
      eventTime: entry.eventTime,
      link: eventUrl.toString(),
    };
  });

  const uniqueRecords = new Map<string, SunEventRecord>();
  for (const record of parsed) {
    uniqueRecords.set(record.sepID, {
      id: record.sepID,
      eventDate: new Date(record.eventTime).toISOString().slice(0, 10),
      eventClass: 'SEP',
      link: record.link,
      source: 'nasa-donki',
    });
  }
  return [...uniqueRecords.values()].sort((left, right) =>
    left.eventDate === right.eventDate
      ? left.id < right.id
        ? -1
        : left.id > right.id
          ? 1
          : 0
      : left.eventDate < right.eventDate
        ? -1
        : 1,
  );
}

function bundledResult(warning: string): SunEventLoadResult {
  return {
    events: BUNDLED_SUN_EVENTS.map((event) => ({ ...event })),
    source: 'bundled',
    warning,
  };
}

export async function loadSunEventsFromDonki(
  fetcher: typeof fetch = fetch,
  now = new Date(),
): Promise<SunEventLoadResult> {
  const endDate = now.toISOString().slice(0, 10);
  const startDate = new Date(now.getTime() - 29 * DAY_IN_MS)
    .toISOString()
    .slice(0, 10);
  const url = new URL(DONKI_SEP_ENDPOINT);
  url.searchParams.set('startDate', startDate);
  url.searchParams.set('endDate', endDate);
  url.searchParams.set('api_key', 'DEMO_KEY');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetcher(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`NASA DONKI returned HTTP ${response.status}.`);
    }
    const events = parseDonkiRecords(await response.json());
    if (events.length === 0) {
      return bundledResult('NASA DONKI returned no SEP records for the last 30 days.');
    }
    return { events, source: 'nasa-donki', warning: '' };
  } catch (error) {
    const message = controller.signal.aborted
      ? `NASA DONKI timed out after ${REQUEST_TIMEOUT_MS / 1_000} seconds.`
      : error instanceof Error
        ? error.message
        : 'NASA DONKI could not be reached.';
    return bundledResult(`${message} Using the verified bundled archive.`);
  } finally {
    clearTimeout(timeout);
  }
}
