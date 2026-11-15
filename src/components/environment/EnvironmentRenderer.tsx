import type { GameEvent, Scenario } from '../../engine/types';

const particles = Array.from({ length: 22 }, (_, index) => ({
  left: `${(index * 47 + 11) % 100}%`,
  top: `${(index * 31 + 7) % 86}%`,
  delay: `${-((index * 7) % 19)}s`,
  duration: `${18 + ((index * 11) % 20)}s`,
  size: `${index % 5 === 0 ? 3 : 2}px`,
}));

interface EnvironmentRendererProps {
  scenario: Scenario;
  events: GameEvent[];
  power: number;
  oxygen: number;
}

export default function EnvironmentRenderer({
  scenario,
  events,
  power,
  oxygen,
}: EnvironmentRendererProps) {
  const activeEventTypes = new Set(
    events.filter((event) => event.active || event.warned).map((event) => event.type),
  );
  const dustStorm = scenario === 'mars' && activeEventTypes.has('dust-storm');
  const lunarNight = scenario === 'moon' && activeEventTypes.has('lunar-night');
  const solarEvent = activeEventTypes.has('solar-particle-event');
  const equipmentFailure = activeEventTypes.has('equipment-failure');

  return (
    <div
      aria-hidden="true"
      className="environment-scene"
      data-scenario={scenario}
      data-dust-storm={dustStorm}
      data-lunar-night={lunarNight}
      data-solar-event={solarEvent}
      data-equipment-failure={equipmentFailure}
      data-emergency={power <= 0 || oxygen <= 0}
    >
      <div className="environment-stars" />
      <div className="environment-celestial">
        {scenario === 'moon' ? (
          <div className="environment-earth">
            <span />
          </div>
        ) : (
          <div className="environment-sun" />
        )}
      </div>
      <div className="environment-haze" />
      <div className="environment-ridge environment-ridge-far" />
      <div className="environment-ridge environment-ridge-near" />
      <div className="environment-terrain">
        <span className="terrain-rock terrain-rock-one" />
        <span className="terrain-rock terrain-rock-two" />
        <span className="terrain-crater terrain-crater-one" />
        <span className="terrain-crater terrain-crater-two" />
      </div>
      <div className="environment-event-layer" />
      <div className="environment-particles">
        {particles.map((particle, index) => (
          <span
            key={index}
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>
      <div className="environment-horizon-light" />
    </div>
  );
}
