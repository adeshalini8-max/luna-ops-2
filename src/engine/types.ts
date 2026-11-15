export type Scenario = 'moon' | 'mars';
export type Mode = 'cadet' | 'engineer';
export type AppPhase = 'title' | 'select' | 'tutorial' | 'design' | 'operate' | 'debrief' | 'result';
export type TickSpeed = 1 | 5;

export interface SunEventRecord {
  id: string;
  eventDate: string;
  eventClass: string;
  link: string;
  source: 'nasa-donki' | 'bundled';
}

export interface Resources {
  power: number;
  oxygen: number;
  water: number;
  food: number;
  radiationDose: number;
  morale: number;
  massBudget: number;
  creditBudget: number;
}

export type ResourceKey = keyof Resources;
export type StoredResourceKey = 'oxygen' | 'water' | 'food';

export type ModuleType =
  | 'solar_panel'
  | 'reactor'
  | 'battery'
  | 'o2_generator'
  | 'water_reclaimer'
  | 'greenhouse'
  | 'regolith_shield'
  | 'storm_shelter'
  | 'habitat';

export interface OutpostModule {
  id: string;
  moduleType: ModuleType;
  name: string;
  description: string;
  scientificNote: string;
  mass: number;
  costCredits: number;
  powerProduced: number;
  powerConsumed: number;
  produces: Partial<Resources>;
  consumes: Partial<Resources>;
  inputs: Partial<Resources>;
  outputs: Partial<Resources>;
  storageCapacity?: number;
  radiationProtection?: number;
  powerPriority: number;
  deployedDay?: number;
  offlineUntilDay?: number;
}

export type GameEventType =
  | 'dust-storm'
  | 'lunar-night'
  | 'solar-particle-event'
  | 'equipment-failure';

export interface GameEvent {
  id: string;
  type: GameEventType;
  name: string;
  description: string;
  startDay: number;
  durationDays: number;
  active: boolean;
  warned: boolean;
  warningStartDay?: number;
  solarReduction?: number;
  radiationDosePerDay?: number;
  targetModuleType?: ModuleType;
  targetModuleId?: string;
  sourceDate?: string;
  eventClass?: string;
}

export type Action =
  | { day: number; type: 'deploy-module'; payload: { moduleId: string } }
  | { day: number; type: 'repair-module'; payload: { moduleId: string } }
  | { day: number; type: 'order-shelter'; payload: Record<string, never> }
  | { day: number; type: 'set-ration-level'; payload: { level: number } }
  | {
      day: number;
      type: 'set-power-priority';
      payload: { moduleId: string; priority: number };
    };

export interface ActionLog {
  id: string;
  action: Action;
  status: 'applied' | 'rejected';
  message: string;
}

export interface CauseLog {
  id: string;
  day: number;
  system: string;
  delta: number;
  reason: string;
  parentId?: string;
}

export interface ResourceCaps {
  power: number;
  oxygen: number;
  water: number;
  food: number;
  radiationDose: number;
  morale: number;
  massBudget: number;
  creditBudget: number;
}

export interface StressDays {
  power: number;
  oxygen: number;
  water: number;
  food: number;
  radiation: number;
  morale: number;
}

export interface MissionResult {
  seed: number;
  scenario: Scenario;
  mode: Mode;
  daysSurvived: number;
  success: boolean;
  failureReason: string;
  actionLog: ActionLog[];
  causeLog: CauseLog[];
}

export interface MissionState {
  seed: number;
  scenario: Scenario;
  mode: Mode;
  daysPassed: number;
  isPaused: boolean;
  gameOver: boolean;
  debriefReason: string;
  resources: Resources;
  resourceCaps: ResourceCaps;
  builtModules: OutpostModule[];
  scheduledEvents: GameEvent[];
  events: GameEvent[];
  activeEvents: GameEvent[];
  shelterOrderedUntilDay: number;
  rationLevel: number;
  stressDays: StressDays;
  actionLog: ActionLog[];
  causeLog: CauseLog[];
  logs: string[];
  missionResult?: MissionResult;
}

export interface GameState extends MissionState {
  appPhase: AppPhase;
  selectedScenario: Scenario;
  selectedMode: Mode;
  tickSpeed: TickSpeed;
  realSunMode: boolean;
  sunEvents: SunEventRecord[];
  missionSunEvents: SunEventRecord[];
  replayActions: Action[];
  replayCursor: number;
  inputError: string;
  goToSelect: () => void;
  chooseScenario: (scenario: Scenario) => void;
  chooseMode: (mode: Mode) => void;
  enterTutorial: () => void;
  skipTutorial: () => void;
  finishTutorial: () => void;
  startMission: (seed?: number) => void;
  startOperations: () => void;
  setTickSpeed: (speed: TickSpeed) => void;
  setRealSunMode: (enabled: boolean) => void;
  setSunEvents: (events: SunEventRecord[]) => void;
  loadReplay: (payload: ReplayPayload) => void;
  setInputError: (message: string) => void;
  togglePause: () => void;
  buildModule: (moduleId: string) => void;
  dispatchAction: (action: Action) => void;
  tick: () => void;
  restartMission: () => void;
}

export interface ReplayPayload {
  version: 1;
  seed: number;
  scenario: Scenario;
  mode: Mode;
  actions: Action[];
  sunEvents?: SunEventRecord[];
  realSunMode?: boolean;
}
