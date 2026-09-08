// STEALTH MODE - Core Types
export type AgentRole = 'researcher' | 'engineer' | 'designer' | 'marketer' | 'sales' | 'hr' | 'finance' | 'legal';
export type AgentTier = 1 | 2;

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  tier: AgentTier;
  skills: Record<AgentRole, number>; // 0-100
  traits: string[];
  morale: number;
  loyalty: number;
  salary: number; // per month
  currentTask: string | null; // product id or null
  personality: string;
  isPrincipal: boolean;
}

export interface Product {
  id: string;
  name: string;
  companyId: string;
  category: string;
  stage: 'idea' | 'building' | 'beta' | 'launched' | 'scaling';
  progress: number; // 0-100
  quality: number; // 0-100
  bugs: number;
  techDebt: number;
  assignedAgents: string[];
  users: number;
  mrr: number;
  rating: number; // 1-5
}

export interface Competitor {
  id: string;
  name: string;
  valuation: number;
  cash: number;
  focus: string;
  aggression: number;
  users: number;
  productQuality: number;
  trend: 'up' | 'down' | 'flat';
  lastAction?: string;
}

export interface GameEvent {
  id: string;
  date: string;
  headline: string;
  effect: string;
  type: 'trend' | 'crisis' | 'opportunity' | 'market';
}

export interface FundingRound {
  id: string;
  name: string;
  amount: number;
  equity: number;
  requirementMRR: number;
  deadlineDays: number | null;
}

export interface BoardState {
  equityGiven: number;
  lastRound: string | null;
  pressure: number; // 0-100
  targetMRR: number | null;
  deadlineDays: number | null;
}

export interface MarketingChannel {
  id: string;
  name: string;
  spend: number; // per month
  active: boolean;
  cac: number;
  churnImpact: number;
}

export interface TechNode {
  id: string;
  name: string;
  cost: number;
  unlocked: boolean;
  researching: boolean;
  progress: number;
  unlocks: string[];
}

export interface StealthCompany {
  id: string;
  name: string;
  focus: string;
  progress: number;
  leakRisk: number;
  detected: boolean;
}

export interface HQ {
  id: string;
  city: string;
  country: string;
  capacity: number;
  used: number;
  costModifier: number;
  talentBonus: number;
}

export type OfficeTileType = 'empty' | 'desk' | 'meeting' | 'break' | 'lab';

export interface OfficeTile {
  x: number;
  y: number;
  type: OfficeTileType;
}

export interface OfficeLayout {
  hqId: string;
  tiles: OfficeTile[];
  moraleBonus: number;
}

export type DirtyOpType = 'sue' | 'spy' | 'steal' | 'hostile';

export interface DirtyOp {
  id: string;
  type: DirtyOpType;
  targetId: string;
  targetName: string;
  cost: number;
  risk: number; // 0-100
  status: 'pending' | 'success' | 'failed' | 'cooldown';
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  hqId: string;
  productIds: string[];
  foundedDay: number;
}

export interface SupportState {
  tickets: number;
  rating: number; // 1-5
  staff: number; // support agents assigned
}

export interface GameState {
  date: Date;
  cash: number;
  burnRate: number;
  runway: number;
  valuation: number;
  isPaused: boolean;
  speed: 1 | 2 | 4;
  tickCount: number;
  board: BoardState;
  marketing: MarketingChannel[];
  tech: TechNode[];
  stealth: StealthCompany[];
  hqs: HQ[];
  office: OfficeLayout;
  dirtyOps: DirtyOp[];
  reputation: number; // 0-100
  companies: Company[];
  selectedCompanyId: string;
  support: SupportState;
  prestige: number;
}
