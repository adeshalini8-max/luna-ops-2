import { afterEach, describe, expect, it, vi } from 'vitest';
import { BUNDLED_SUN_EVENTS } from '../data/sunEvents';
import { loadSunEventsFromDonki } from './nasaDonki';

const validPayload = [
  {
    sepID: '2024-01-02T23:22:00-SEP-002',
    eventTime: '2024-01-02T23:22Z',
    link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/28445/-1',
  },
];

afterEach(() => {
  vi.useRealTimers();
});

describe('loadSunEventsFromDonki', () => {
  it('ships a verified offline archive with at least ten NASA event records', () => {
    expect(BUNDLED_SUN_EVENTS.length).toBeGreaterThanOrEqual(10);
    expect(BUNDLED_SUN_EVENTS.every((event) => event.source === 'bundled')).toBe(true);
    expect(BUNDLED_SUN_EVENTS.every((event) => event.link.startsWith('https://ccmc.gsfc.nasa.gov/'))).toBe(true);
  });

  it('normalizes valid SEP records into deterministic event metadata', async () => {
    const fetcher: typeof fetch = async () => new Response(JSON.stringify(validPayload));
    const result = await loadSunEventsFromDonki(fetcher, new Date('2026-11-14T12:00:00Z'));

    expect(result).toEqual({
      source: 'nasa-donki',
      warning: '',
      events: [
        {
          id: '2024-01-02T23:22:00-SEP-002',
          eventDate: '2024-01-02',
          eventClass: 'SEP',
          link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/28445/-1',
          source: 'nasa-donki',
        },
      ],
    });
  });

  it('uses the bundled archive when the response shape is invalid', async () => {
    const fetcher: typeof fetch = async () => new Response(JSON.stringify({ records: [] }));
    const result = await loadSunEventsFromDonki(fetcher);

    expect(result.source).toBe('bundled');
    expect(result.warning).toContain('unexpected response shape');
    expect(result.events).toHaveLength(BUNDLED_SUN_EVENTS.length);
  });

  it('uses the bundled archive on network failure', async () => {
    const fetcher: typeof fetch = async () => {
      throw new Error('offline');
    };
    const result = await loadSunEventsFromDonki(fetcher);

    expect(result.source).toBe('bundled');
    expect(result.warning).toContain('offline');
  });

  it('aborts after four seconds and falls back without blocking callers', async () => {
    vi.useFakeTimers();
    const fetcher: typeof fetch = (_input, init) =>
      new Promise((_, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true },
        );
      });

    const resultPromise = loadSunEventsFromDonki(fetcher);
    await vi.advanceTimersByTimeAsync(4_000);
    const result = await resultPromise;

    expect(result.source).toBe('bundled');
    expect(result.warning).toContain('timed out after 4 seconds');
  });
});
