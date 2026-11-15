import { useGameStore } from '../../store/gameStore';

interface FlowNode {
  id: string;
  title: string;
  x: number;
  y: number;
}

const nodes: FlowNode[] = [
  { id: 'power', title: 'POWER', x: 90, y: 108 },
  { id: 'oxygen', title: 'O₂', x: 260, y: 45 },
  { id: 'water', title: 'H₂O', x: 260, y: 108 },
  { id: 'food', title: 'FOOD', x: 260, y: 171 },
  { id: 'crew', title: 'CREW', x: 520, y: 108 },
];

const links = [
  { from: 'power', to: 'oxygen', label: 'electrolysis' },
  { from: 'power', to: 'water', label: 'recycling' },
  { from: 'power', to: 'food', label: 'lighting' },
  { from: 'oxygen', to: 'crew', label: 'breathing' },
  { from: 'water', to: 'crew', label: 'hydration' },
  { from: 'food', to: 'crew', label: 'nutrition' },
  { from: 'crew', to: 'water', label: 'waste recovery' },
];

export default function ResourceFlow() {
  const resources = useGameStore((state) => state.resources);
  const availableModules = useGameStore((state) => state.builtModules);
  const day = useGameStore((state) => state.daysPassed);
  const operational = availableModules.filter(
    (module) => (module.offlineUntilDay ?? 0) <= day,
  );
  const producers = {
    oxygen: operational.some((module) => module.outputs.oxygen),
    water: operational.some((module) => module.outputs.water),
    food: operational.some((module) => module.outputs.food),
    power: operational.some((module) => module.powerProduced > 0),
  };
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  function isStarved(link: (typeof links)[number]) {
    const threshold = 8;
    if (link.from === 'power') return resources.power < threshold;
    if (link.to === 'crew') {
      if (link.from === 'oxygen') return resources.oxygen < threshold;
      if (link.from === 'water') return resources.water < threshold;
      if (link.from === 'food') return resources.food < threshold;
    }
    return false;
  }

  return (
    <figure className="rounded-lg border border-zinc-800 bg-zinc-950/75 p-2 sm:p-3">
      <figcaption className="mb-1 flex items-center justify-between px-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
        <span>Resource flow · daily system links</span>
        <span className="text-zinc-600">— starved link</span>
      </figcaption>
      <svg
        viewBox="0 0 640 220"
        role="img"
        aria-labelledby="resource-flow-title resource-flow-description"
        className="h-auto w-full"
      >
        <title id="resource-flow-title">Outpost resource flow diagram</title>
        <desc id="resource-flow-description">Power supports oxygen, water recycling and food production. Oxygen, water and food flow to the crew; crew waste is reclaimed as water.</desc>
        {links.map((link) => {
          const start = nodeMap.get(link.from);
          const end = nodeMap.get(link.to);
          if (!start || !end) return null;
          const starved = isStarved(link);
          const reverse = link.from === 'crew';
          const path = reverse
            ? `M ${start.x + 52} ${start.y} C 420 ${start.y + 44}, 356 ${end.y + 38}, ${end.x + 52} ${end.y}`
            : `M ${start.x + 52} ${start.y} C 176 ${start.y}, 194 ${end.y}, ${end.x} ${end.y}`;
          return (
            <g key={`${link.from}-${link.to}`}>
              <path d={path} fill="none" stroke={starved ? '#fb7185' : '#22d3ee'} strokeWidth="2" strokeDasharray={starved ? '5 4' : 'none'} />
              <text x={(start.x + end.x) / 2 + 35} y={(start.y + end.y) / 2 - 5} fill={starved ? '#fda4af' : '#a1a1aa'} fontSize="8" textAnchor="middle">
                {starved ? 'STARVED' : link.label.toUpperCase()}
              </text>
            </g>
          );
        })}
        {nodes.map((node) => {
          const depleted =
            node.id === 'power'
              ? resources.power < 8
              : node.id === 'oxygen'
                ? resources.oxygen < 8
                : node.id === 'water'
                  ? resources.water < 8
                  : node.id === 'food'
                    ? resources.food < 8
                    : false;
          const produced =
            node.id === 'crew' ||
            (node.id === 'power'
              ? producers.power
              : node.id === 'oxygen'
                ? producers.oxygen
                : node.id === 'water'
                  ? producers.water
                  : node.id === 'food'
                    ? producers.food
                    : false);
          return (
            <g key={node.id} aria-label={`${node.title}: ${depleted ? 'critical' : produced ? 'produced or supplied' : 'stored supply'}`}>
              <rect
                x={node.x}
                y={node.y - 20}
                width="104"
                height="40"
                rx="8"
                fill="#18181b"
                stroke={depleted ? '#fb7185' : produced ? '#22d3ee' : '#52525b'}
                strokeWidth="1.5"
              />
              <text x={node.x + 52} y={node.y + 4} fill={depleted ? '#fda4af' : '#e4e4e7'} fontSize="11" fontWeight="700" textAnchor="middle">
                {node.title}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
