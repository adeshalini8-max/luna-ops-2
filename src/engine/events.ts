import { EVENT_SCHEDULE_HORIZON_DAYS } from './constants';
import { mulberry32 } from './rng';
import type { GameEvent, ModuleType, Scenario, SunEventRecord } from './types';
import type { SeededRng } from './rng';

/**
 * Event timing and magnitudes are game-scaled scheduling values. Dust-storm
 * ranges model the brief's desired scenario variety, not a forecast.
 */
export function createEventSchedule(
  seed: number,
  scenario: Scenario,
  rng: SeededRng = mulberry32(seed),
  horizonDays = EVENT_SCHEDULE_HORIZON_DAYS,
  sunEvents: readonly SunEventRecord[] = [],
): GameEvent[] {
  const events: GameEvent[] = [];

  if (scenario === 'moon') {
    for (const startDay of [12, 42, 72]) {
      events.push({
        id: `lunar-night-${startDay}`,
        type: 'lunar-night',
        name: 'Lunar Night',
        description: 'No solar generation during this scheduled 14-day night.',
        startDay,
        durationDays: 14,
        active: false,
        warned: false,
      });
    }
  } else {
    const firstStormDay = 4 + Math.floor(rng(0) * 5);
    const secondStormDay = 23 + Math.floor(rng(1) * 5);
    for (const [index, startDay] of [firstStormDay, secondStormDay].entries()) {
      events.push({
        id: `dust-storm-${index + 1}-${startDay}`,
        type: 'dust-storm',
        name: 'Dust Storm',
        description: 'Suspended dust reduces solar array output.',
        startDay,
        durationDays: 3 + Math.floor(rng(2 + index) * 8),
        active: false,
        warned: false,
        solarReduction: 0.6 + rng(4 + index) * 0.3,
      });
    }
  }

  if (sunEvents.length > 0) {
    sunEvents.slice(0, 6).forEach((sunEvent, index) => {
      const startDay = 9 + index * 13 + Math.floor(rng(100 + index) * 3);
      if (startDay > horizonDays) return;
      events.push({
        id: `solar-particle-event-${sunEvent.id}-${startDay}`,
        type: 'solar-particle-event',
        name: `Solar Particle Event · ${sunEvent.eventClass}`,
        description: `Historical DONKI event from ${sunEvent.eventDate}; scheduled as a deterministic training scenario.`,
        startDay,
        durationDays: 2,
        active: false,
        warned: false,
        warningStartDay: Math.max(1, startDay - 1 - Math.floor(rng(200 + index) * 2)),
        radiationDosePerDay: 24 + rng(300 + index) * 4,
        sourceDate: sunEvent.eventDate,
        eventClass: sunEvent.eventClass,
      });
    });
  } else {
    const particleStartDay =
      (scenario === 'moon' ? 15 : 14) + Math.floor(rng(6) * 5);
    const warningDays = 1 + Math.floor(rng(7) * 2);
    events.push({
      id: `solar-particle-event-${particleStartDay}`,
      type: 'solar-particle-event',
      name: 'Solar Particle Event',
      description: 'Warning period before elevated crew radiation exposure.',
      startDay: particleStartDay,
      durationDays: 2,
      active: false,
      warned: false,
      warningStartDay: Math.max(1, particleStartDay - warningDays),
      radiationDosePerDay: 24 + rng(8) * 4,
    });
  }

  const failureStartDay = 20 + Math.floor(rng(9) * 6);
  const failureTargets: ModuleType[] = [
    'water_reclaimer',
    'o2_generator',
    'greenhouse',
    'reactor',
  ];
  events.push({
    id: `equipment-failure-${failureStartDay}`,
    type: 'equipment-failure',
    name: 'Equipment Failure',
    description: 'A scheduled fault takes the affected module offline until repaired.',
    startDay: failureStartDay,
    durationDays: 2 + Math.floor(rng(10) * 3),
    active: false,
    warned: false,
    targetModuleType: failureTargets[Math.floor(rng(11) * failureTargets.length)],
  });

  return events
    .filter((event) => event.startDay <= horizonDays)
    .sort((left, right) => {
      const dayDifference = left.startDay - right.startDay;
      if (dayDifference !== 0) return dayDifference;
      return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
    });
}

export function updateScheduledEvents(
  scheduledEvents: readonly GameEvent[],
  day: number,
): GameEvent[] {
  return scheduledEvents.map((event) => ({
    ...event,
    active: day >= event.startDay && day < event.startDay + event.durationDays,
    warned:
      event.warningStartDay !== undefined &&
      day >= event.warningStartDay &&
      day < event.startDay,
  }));
}

export function getVisibleEvents(events: readonly GameEvent[]): GameEvent[] {
  return events.filter((event) => event.active || event.warned);
}