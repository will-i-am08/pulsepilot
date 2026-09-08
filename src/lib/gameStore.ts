import { create } from 'zustand';
import type { Agent, AgentRole, Product, Competitor, GameEvent, GameState, MarketingChannel, TechNode, HQ, StealthCompany, BoardState } from './types';

const NAMES = ['Ava Chen', 'Marcus Reid', 'Sofia Park', 'James Okafor', 'Lena Torres', 'Dev Patel', 'Zara Quinn', 'Ethan Holt'];
const COMPETITOR_NAMES = ['Nexora', 'Blip AI', 'ValleyFlow', 'Stratos', 'Quantic', 'Tide Labs', 'Aether', 'PulseForge', 'Lumen', 'Orbital', 'Kairo', 'Vanta', 'Nimble', 'Helix', 'Forge'];

function generateAgents(): Agent[] {
  return [
    {
      id: 'a1', name: 'Mira Sol — CTO', role: 'engineer', tier: 1,
      skills: { engineer: 92, researcher: 78, designer: 45, marketer: 30, sales: 25, hr: 40, finance: 35, legal: 20 },
      traits: ['Perfectionist', 'Loyal'], morale: 88, loyalty: 96, salary: 14200, currentTask: null,
      personality: 'Brilliant CTO who gives strategic trade-offs', isPrincipal: true
    },
    {
      id: 'a2', name: NAMES[0], role: 'researcher', tier: 2,
      skills: { engineer: 60, researcher: 88, designer: 40, marketer: 30, sales: 20, hr: 30, finance: 25, legal: 15 },
      traits: ['Curious', 'Burns Out Fast'], morale: 80, loyalty: 74, salary: 8800, currentTask: null,
      personality: 'Researcher', isPrincipal: false
    },
    {
      id: 'a3', name: NAMES[1], role: 'engineer', tier: 2,
      skills: { engineer: 85, researcher: 50, designer: 35, marketer: 20, sales: 15, hr: 25, finance: 20, legal: 10 },
      traits: ['Fast Coder', 'Tech Debt Creator'], morale: 84, loyalty: 78, salary: 10500, currentTask: null,
      personality: '', isPrincipal: false
    },
    {
      id: 'a4', name: NAMES[2], role: 'designer', tier: 2,
      skills: { engineer: 30, researcher: 40, designer: 90, marketer: 65, sales: 30, hr: 40, finance: 20, legal: 10 },
      traits: ['Pixel Perfect'], morale: 90, loyalty: 82, salary: 8400, currentTask: null,
      personality: '', isPrincipal: false
    },
    {
      id: 'a5', name: NAMES[3], role: 'marketer', tier: 2,
      skills: { engineer: 15, researcher: 35, designer: 45, marketer: 87, sales: 70, hr: 50, finance: 30, legal: 20 },
      traits: ['Growth Hacker'], morale: 88, loyalty: 76, salary: 9100, currentTask: null,
      personality: '', isPrincipal: false
    },
  ];
}

function generateCompetitors(): Competitor[] {
  return COMPETITOR_NAMES.slice(0, 15).map((name, i) => ({
    id: `c${i}`, name, valuation: 20_000_000 + Math.random() * 800_000_000,
    cash: 5_000_000 + Math.random() * 50_000_000,
    focus: ['AI Tools', 'SaaS', 'Social', 'Fintech', 'Hardware'][i % 5],
    aggression: 30 + Math.random() * 60,
    users: Math.floor(5000 + Math.random() * 500000),
    productQuality: 40 + Math.random() * 50,
    trend: (['up', 'down', 'flat'][Math.floor(Math.random() * 3)] as Competitor['trend'])
  }));
}

const initialProducts: Product[] = [
  { id: 'p1', name: 'PulseAI (MVP)', companyId: 'co1', category: 'AI Tools', stage: 'building', progress: 34, quality: 62, bugs: 12, techDebt: 8, assignedAgents: [], users: 0, mrr: 0, rating: 0 },
];

const initialEvents: GameEvent[] = [
  { id: 'e1', date: '28/08/2026', headline: 'Nexora raises $40M at $400M — eyes AI video market', effect: 'Competition heating in AI Tools', type: 'market' },
  { id: 'e2', date: '25/08/2026', headline: 'EU signals new AI ad regulations — AdTech stocks wobble', effect: 'AdTech growth -15% for 2 quarters', type: 'crisis' },
];

const initialMarketing: MarketingChannel[] = [
  { id: 'ads', name: 'Paid Ads', spend: 0, active: false, cac: 18, churnImpact: 5 },
  { id: 'content', name: 'Content / Social', spend: 0, active: false, cac: 8, churnImpact: -8 },
  { id: 'influencer', name: 'Influencers', spend: 0, active: false, cac: 25, churnImpact: 2 },
  { id: 'sales', name: 'Enterprise Sales', spend: 0, active: false, cac: 45, churnImpact: -12 },
];

const initialTech: TechNode[] = [
  { id: 'cloud', name: 'Cloud Infra', cost: 0, unlocked: true, researching: false, progress: 100, unlocks: ['ml'] },
  { id: 'ml', name: 'ML Basics', cost: 15000, unlocked: true, researching: false, progress: 100, unlocks: ['llm'] },
  { id: 'llm', name: 'LLM Foundation', cost: 40000, unlocked: false, researching: false, progress: 0, unlocks: ['multi'] },
  { id: 'multi', name: 'Multimodal', cost: 85000, unlocked: false, researching: false, progress: 0, unlocks: ['agi'] },
  { id: 'agi', name: 'AGI Prototype', cost: 200000, unlocked: false, researching: false, progress: 0, unlocks: [] },
];

const initialHQs: HQ[] = [
  { id: 'sf', city: 'San Francisco', country: 'USA', capacity: 12, used: 5, costModifier: 1.0, talentBonus: 12 },
  { id: 'lisbon', city: 'Lisbon', country: 'Portugal', capacity: 8, used: 0, costModifier: 0.6, talentBonus: 4 },
  { id: 'blr', city: 'Bengaluru', country: 'India', capacity: 20, used: 0, costModifier: 0.45, talentBonus: 6 },
];

function generateOfficeTiles(): import('./types').OfficeTile[] {
  const tiles: import('./types').OfficeTile[] = [];
  for (let y = 0; y < 6; y++) for (let x = 0; x < 8; x++) tiles.push({ x, y, type: 'empty' as const });
  // pre-place some
  tiles[0].type = 'desk'; tiles[1].type = 'desk'; tiles[8].type = 'desk'; tiles[9].type = 'desk'; tiles[16].type = 'break';
  return tiles;
}

interface Store extends GameState {
  agents: Agent[];
  products: Product[];
  competitors: Competitor[];
  events: GameEvent[];
  selectedProductId: string | null;
  advanceDay: () => void;
  togglePause: () => void;
  setSpeed: (s: 1 | 2 | 4) => void;
  assignAgent: (agentId: string, productId: string | null) => void;
  hireAgent: (role: Agent['role']) => void;
  // V1 expansions
  raiseFunding: (round: 'angel' | 'seed' | 'seriesA' | 'loan') => void;
  toggleMarketing: (id: string) => void;
  setMarketingSpend: (id: string, spend: number) => void;
  startResearch: (id: string) => void;
  freeResearch: (prompt: string) => void;
  createStealth: (focus: string) => void;
  unlockHQ: (id: string) => void;
  placeTile: (x: number, y: number, type: import('./types').OfficeTileType) => void;
  executeDirtyOp: (type: import('./types').DirtyOpType, targetId: string) => void;
  createCompany: (name: string, industry: string) => void;
  selectCompany: (id: string) => void;
  createProduct: (companyId: string, name: string, category: string) => void;
  assignSupport: (count: number) => void;
}

export const useGameStore = create<Store>((set, get) => ({
  date: new Date(2026, 7, 28),
  cash: 345000,
  burnRate: 51200,
  runway: 6.7,
  valuation: 3400000,
  isPaused: false,
  speed: 1,
  tickCount: 0,
  agents: generateAgents(),
  products: initialProducts,
  competitors: generateCompetitors(),
  events: initialEvents,
  selectedProductId: 'p1',
  board: { equityGiven: 0, lastRound: null, pressure: 0, targetMRR: null, deadlineDays: null } as BoardState,
  marketing: initialMarketing,
  tech: initialTech,
  stealth: [] as StealthCompany[],
  hqs: initialHQs,
  office: { hqId: 'sf', tiles: generateOfficeTiles(), moraleBonus: 5 },
  dirtyOps: [],
  reputation: 72,
  companies: [{ id: 'co1', name: 'Pulse Labs', industry: 'AI Tools', hqId: 'sf', productIds: ['p1'], foundedDay: 0 }],
  selectedCompanyId: 'co1',
  support: { tickets: 34, rating: 4.2, staff: 0 },
  prestige: 0,

  advanceDay: () => {
    const s = get();
    if (s.isPaused) return;
    const nextDate = new Date(s.date);
    nextDate.setDate(nextDate.getDate() + 1);

    // progress products based on assigned agents
    let newProducts = s.products.map(p => {
      if (p.assignedAgents.length === 0) return p;
      const assigned = s.agents.filter(a => p.assignedAgents.includes(a.id));
      const avgSkill = assigned.reduce((sum, a) => sum + a.skills[p.category === 'AI Tools' ? 'engineer' : a.role], 0) / assigned.length || 50;
      // engineers/researchers drive progress, designers drive quality
      const progressGain = (avgSkill / 100) * 2.8 * (0.8 + Math.random() * 0.4); // 1.5-3.5 per day with full team
      const qualityGain = assigned.some(a => a.role === 'designer') ? 0.3 : 0.15;
      const bugChance = Math.random() < 0.12 ? 1 : 0;
      let next = { ...p };
      if (p.stage === 'building' || p.stage === 'beta') {
        next.progress = Math.min(100, p.progress + progressGain);
        next.quality = Math.min(100, p.quality + qualityGain);
        next.bugs += bugChance;
        if (next.progress >= 100 && p.stage === 'building') {
          next.stage = 'beta';
          next.progress = 0;
        } else         if (next.progress >= 100 && p.stage === 'beta') {
          next.stage = 'launched';
          next.progress = 100;
          next.users = 2200 + Math.floor(Math.random() * 2800);
          next.mrr = next.users * 26;
          next.rating = 3.7 + Math.random() * 0.9;
        }
      }
      if (p.stage === 'launched') {
        // marketing + support-driven growth — rebalanced: higher organic, higher MRR/user
        const marketingSpend = get().marketing.filter(m => m.active).reduce((s, m) => s + m.spend, 0);
        const marketingBoost = marketingSpend > 0 ? (marketingSpend / 10000) * 0.018 : 0;
        const supportPenalty = s.support.rating < 3.5 ? 0.006 : s.support.rating < 4.0 ? 0.002 : 0;
        const churn = 0.0015 + (s.marketing.find(m => m.id === 'ads' && m.active) ? 0.001 : 0) + supportPenalty;
        const organic = (p.quality - 60) / 1400 + (Math.random() - 0.5) * 0.015;
        next.users = Math.floor(p.users * (1 + organic + marketingBoost - churn));
        next.users = Math.max(0, next.users);
        next.mrr = next.users * 26;
        // rating drifts with support
        next.rating = Math.max(1, Math.min(5, p.rating * 0.995 + s.support.rating * 0.005));
        // tech debt slows future
        next.techDebt = Math.min(100, p.techDebt + (p.bugs > 10 ? 0.1 : 0));
      }
      return next;
    });

    // tech research tick
    let newTech = s.tech;
    const researching = s.tech.find(t => t.researching);
    if (researching) {
      const researchers = s.agents.filter(a => a.role === 'researcher' && a.currentTask === researching.id).length;
      const gain = (researchers > 0 ? 2.5 : 0.4) * (1 + Math.random() * 0.3);
      newTech = s.tech.map(t => t.id === researching.id ? { ...t, progress: Math.min(100, t.progress + gain) } : t);
      const done = newTech.find(t => t.id === researching.id && t.progress >= 100);
      if (done) {
        newTech = newTech.map(t => t.id === done.id ? { ...t, researching: false, unlocked: true } : t);
        // auto-unlock next? keep locked until player starts
      }
    }

    // board pressure tick
    let newBoard = s.board;
    if (s.board.deadlineDays !== null) {
      const nextDeadline = s.board.deadlineDays - 1;
      const mrr = newProducts.reduce((sum, p) => sum + p.mrr, 0);
      const target = s.board.targetMRR || 0;
      let pressure = s.board.pressure;
      if (nextDeadline <= 0) {
        if (mrr < target) pressure = Math.min(100, pressure + 25);
        else pressure = Math.max(0, pressure - 15);
      }
      // weekly pressure from equity
      if (s.tickCount % 7 === 0 && s.board.equityGiven > 30) pressure = Math.min(100, pressure + 1);
      newBoard = { ...s.board, deadlineDays: nextDeadline <= -30 ? null : nextDeadline, pressure };
    }

    // stealth progress
    let newStealth = s.stealth.map(sc => {
      if (sc.detected) return sc;
      const assigned = s.agents.filter(a => a.currentTask === sc.id).length;
      const prog = assigned > 0 ? 1.2 + assigned * 0.8 : 0;
      const leak = sc.leakRisk + (assigned > 0 ? 0.15 : 0) + Math.random() * 0.1;
      const detected = leak > 85 && Math.random() < 0.3;
      return { ...sc, progress: Math.min(100, sc.progress + prog), leakRisk: Math.min(100, leak), detected };
    });

    // HR / Finance / Legal passive effects + burnout
    const hrCount = s.agents.filter(a => a.role === 'hr').length;
    const financeCount = s.agents.filter(a => a.role === 'finance').length;
    const legalCount = s.agents.filter(a => a.role === 'legal').length;
    let newAgents: typeof s.agents = s.agents.map(a => {
      let m = a.morale;
      const isAssigned = !!a.currentTask;
      if (hrCount > 0 && s.office.moraleBonus > 0) m += 0.4 + s.office.moraleBonus * 0.08;
      else if (s.office.moraleBonus < 0) m -= 0.5;
      if (isAssigned && s.tickCount % 3 === 0) m -= 0.3;
      if (!isAssigned) m += 0.2;
      let l = a.loyalty;
      if (hrCount > 0) l += 0.15;
      else l -= 0.04;
      if (m < 30) l -= 0.25;
      return { ...a, morale: Math.max(0, Math.min(100, m)), loyalty: Math.max(0, Math.min(100, l)) };
    });
    // Finance passive: burn reduction up to 12%
    const financeReduction = Math.min(0.12, financeCount * 0.03);
    // Legal passive applied later to poach/lawsuit odds

    // support tickets & rating (SupportState)
    let newSupport = { ...s.support };
    const totalUsers = newProducts.reduce((sum, p) => sum + (p.stage === 'launched' ? p.users : 0), 0);
    const totalBugs = newProducts.reduce((sum, p) => sum + p.bugs, 0);
    // tickets grow with users and bugs, shrink with support staff
    const ticketGrowth = Math.floor(totalUsers * 0.003 + totalBugs * 1.2 + Math.random() * 5);
    const ticketsCleared = s.support.staff * 8 + Math.floor(Math.random() * 4);
    newSupport.tickets = Math.max(0, s.support.tickets + ticketGrowth - ticketsCleared);
    // rating drifts toward target based on tickets per 1k users
    const ticketsPerK = totalUsers > 0 ? (newSupport.tickets / totalUsers) * 1000 : 0;
    const targetRating = ticketsPerK < 8 ? 4.6 : ticketsPerK < 20 ? 4.1 : ticketsPerK < 40 ? 3.4 : 2.8;
    newSupport.rating = Math.max(1, Math.min(5, s.support.rating * 0.96 + targetRating * 0.04 + (Math.random() - 0.5) * 0.05));

    // burn includes marketing spend
    const marketingMonthly = s.marketing.filter(m => m.active).reduce((sum, m) => sum + m.spend, 0);
    const totalBurn = s.burnRate + marketingMonthly;
    const dailyTotalBurn = totalBurn / 30;

    // competitors tick weekly (every 7 days) — Aggressive AI
    let newCompetitors = s.competitors;
    let cashDelta = 0;
    let burnDelta = 0;
    let moraleHit = 0;
    // apply finance burn reduction to daily burn via burnDelta
    burnDelta -= Math.floor(s.burnRate * financeReduction);
    const playerMRR = newProducts.reduce((sum, p) => sum + p.mrr, 0);
    const playerQuality = newProducts[0]?.quality || 0;
    const playerLaunched = newProducts.some(p => p.stage === 'launched');
    let aggressiveEvents: GameEvent[] = [];

    if (s.tickCount % 7 === 0) {
      newCompetitors = s.competitors.map(c => {
        let next = {
          ...c,
          valuation: c.valuation * (1 + (c.trend === 'up' ? 0.015 : c.trend === 'down' ? -0.01 : 0) + (Math.random() - 0.5) * 0.02),
          users: Math.floor(c.users * (1 + (Math.random() - 0.48) * 0.03)),
          lastAction: undefined as string | undefined,
        };
        // Aggressive checks only if player is threat
        const isThreat = playerLaunched && c.focus === 'AI Tools' && playerQuality > 55;
        if (!isThreat) return next;
        const roll = Math.random();
        // 1. Poach — tightened: base 9% weekly, HR -2.5% each, Legal -1.5%, loyalty threshold 72
        const poachChance = Math.max(0.015, 0.09 - hrCount * 0.025 - legalCount * 0.015 - s.office.moraleBonus * 0.004);
        if (c.aggression > 60 && roll < poachChance && newAgents.length > 1) {
          const victims = newAgents.filter(a => !a.isPrincipal).sort((a, b) => a.loyalty - b.loyalty);
          const target = victims[0];
          if (target && target.loyalty < 72) {
            if (Math.random() < 0.32) {
              newAgents = newAgents.filter(a => a.id !== target.id);
              burnDelta -= target.salary;
              aggressiveEvents.push({
                id: `e${Date.now()}-${c.id}-poach`, date: nextDate.toLocaleDateString('en-AU'),
                headline: `🚨 ${c.name} poached ${target.name} (${target.role}) — loyalty ${target.loyalty}% wasn't enough`,
                effect: `Lost ${target.role}, -$${target.salary.toLocaleString()}/mo burn but -morale team`, type: 'crisis'
              });
              cashDelta += 8000;
              moraleHit += 8;
              next.lastAction = 'poached';
              next.valuation *= 1.03;
            } else {
              aggressiveEvents.push({
                id: `e${Date.now()}-${c.id}-poach-attempt`, date: nextDate.toLocaleDateString('en-AU'),
                headline: `${c.name} tried to poach ${target.name} — Mira counter-offered and kept them`,
                effect: `Loyalty now ${Math.min(100, target.loyalty + 8)}%`, type: 'market'
              });
              newAgents = newAgents.map(a => a.id === target.id ? { ...a, loyalty: Math.min(100, a.loyalty + 8) } : a);
              next.lastAction = 'poach-failed';
            }
          }
        }
        // 2. Copycat launch — if player quality high
        else if (c.aggression > 45 && roll < 0.12 && playerQuality > 68) {
          const copyQuality = Math.min(95, playerQuality - 8 + Math.random() * 10);
          next.productQuality = copyQuality;
          next.users = Math.floor(next.users * 1.12);
          next.lastAction = 'copycat';
          aggressiveEvents.push({
            id: `e${Date.now()}-${c.id}-copy`, date: nextDate.toLocaleDateString('en-AU'),
            headline: `${c.name} launched copycat — Q${Math.floor(copyQuality)} in your space, undercutting by 20%`,
            effect: `Your growth -15% for 2 weeks`, type: 'crisis'
          });
          // apply player growth hit by degrading next tick via temporary debuff — simulate by cutting users slightly
          newProducts = newProducts.map(p => p.stage === 'launched' ? { ...p, users: Math.floor(p.users * 0.97) } : p);
        }
        // 3. Lawsuit / patent troll — if player valuation high
        else if (c.aggression > 55 && roll < 0.07 && s.valuation > 8000000) {
          const fine = 25000 + Math.floor(Math.random() * 40000);
          cashDelta -= fine;
          next.lastAction = 'sued';
          next.cash += fine * 0.6;
          aggressiveEvents.push({
            id: `e${Date.now()}-${c.id}-sue`, date: nextDate.toLocaleDateString('en-AU'),
            headline: `⚖️ ${c.name} sued for IP — settled for $${(fine / 1000).toFixed(0)}k. Legal says hire a Legal agent.`,
            effect: `-$${(fine / 1000).toFixed(0)}k, board pressure +5%`, type: 'crisis'
          });
        }
        return next;
      });
    }

    // random events
    let newEvents = s.events;
    if (Math.random() < 0.02) {
      const headlines = [
        'Blip AI poaches senior engineer from Stratos — talent war escalates',
        'New open-source model drops — research costs -20% for 30 days',
        'Viral TikTok drives 300% signup spike for Social apps',
        'AWS outage — infra costs spike, users complain',
      ];
      newEvents = [{ id: `e${Date.now()}`, date: nextDate.toLocaleDateString('en-AU'), headline: headlines[Math.floor(Math.random() * headlines.length)], effect: 'Market shift', type: 'trend' as const }, ...s.events].slice(0, 8);
    }

    // apply aggressive cash/morale effects
    let finalCash = s.cash - dailyTotalBurn + cashDelta;
    const finalBurn = Math.max(8000, s.burnRate + burnDelta);
    if (moraleHit > 0) {
      newAgents = newAgents.map(a => ({ ...a, morale: Math.max(0, a.morale - moraleHit) }));
    }
    // merge aggressive events into news (keep max 8)
    let mergedEvents = [...aggressiveEvents, ...newEvents].slice(0, 8);
    // if aggressive happened, also bump board pressure a bit
    let finalBoard = newBoard;
    if (aggressiveEvents.some(e => e.type === 'crisis')) {
      finalBoard = { ...newBoard, pressure: Math.min(100, newBoard.pressure + 3) };
    }

    const finalTotalBurn = finalBurn + s.marketing.filter(m => m.active).reduce((sum, m) => sum + m.spend, 0);
    const newRunway = finalCash > 0 ? finalCash / finalTotalBurn : 0;
    const newValuation = 2000000 + newProducts.reduce((sum, p) => sum + p.mrr * 12 * 6, 0) + (finalCash * 0.5);

    set({
      date: nextDate, cash: finalCash, burnRate: finalBurn, runway: newRunway, valuation: newValuation,
      products: newProducts, competitors: newCompetitors, events: mergedEvents, tickCount: s.tickCount + 1,
      tech: newTech, board: finalBoard, stealth: newStealth,
      agents: newAgents,
      support: newSupport,
    });
  },

  togglePause: () => set(s => ({ isPaused: !s.isPaused })),
  setSpeed: (speed) => set({ speed }),

  assignAgent: (agentId, productId) => set(s => {
    const products = s.products.map(p => ({
      ...p,
      assignedAgents: p.assignedAgents.filter(id => id !== agentId).concat(p.id === productId ? [agentId] : [])
    }));
    const agents = s.agents.map(a => a.id === agentId ? { ...a, currentTask: productId } : a);
    return { products, agents };
  }),

  hireAgent: (role) => set(s => {
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const salaryMap: Record<string, number> = { researcher: 9400, engineer: 11000, designer: 8600, marketer: 9300, sales: 8100, hr: 7200, finance: 10500, legal: 12500 };
    const newAgent: Agent = {
      id: `a${Date.now()}`, name, role, tier: 2,
      skills: { engineer: role === 'engineer' ? 80 : 30, researcher: role === 'researcher' ? 85 : 30, designer: role === 'designer' ? 88 : 30, marketer: role === 'marketer' ? 85 : 30, sales: role === 'sales' ? 85 : 30, hr: role === 'hr' ? 85 : 30, finance: role === 'finance' ? 85 : 30, legal: role === 'legal' ? 85 : 30 } as Record<AgentRole, number>,
      traits: ['New Hire'], morale: 85, loyalty: 60, salary: salaryMap[role] || 9000, currentTask: null, personality: '', isPrincipal: false
    };
    const newBurn = s.burnRate + newAgent.salary;
    return { agents: [...s.agents, newAgent], burnRate: newBurn, runway: s.cash / newBurn };
  }),

  raiseFunding: (round) => set(s => {
    const rounds: Record<string, { amount: number; equity: number; targetMRR: number; deadline: number | null }> = {
      angel: { amount: 200000, equity: 8, targetMRR: 8000, deadline: 90 },
      seed: { amount: 750000, equity: 15, targetMRR: 40000, deadline: 120 },
      seriesA: { amount: 3000000, equity: 20, targetMRR: 150000, deadline: 180 },
      loan: { amount: 150000, equity: 0, targetMRR: 0, deadline: null },
    };
    const r = rounds[round];
    if (!r) return {};
    const newEquity = s.board.equityGiven + r.equity;
    const newPressure = r.equity > 0 ? 15 : 0;
    return {
      cash: s.cash + r.amount,
      board: {
        equityGiven: newEquity,
        lastRound: round,
        pressure: newPressure,
        targetMRR: r.targetMRR || s.board.targetMRR,
        deadlineDays: r.deadline,
      },
      burnRate: r.equity === 0 ? s.burnRate + 4500 : s.burnRate, // loan repayment
      events: [{ id: `e${Date.now()}`, date: s.date.toLocaleDateString('en-AU'), headline: `${round.toUpperCase()} raised: $${(r.amount / 1000).toFixed(0)}k for ${r.equity}% — board expects $${(r.targetMRR / 1000).toFixed(0)}k MRR`, effect: `Equity now ${newEquity}%`, type: 'market' as const }, ...s.events].slice(0, 8),
    };
  }),

  toggleMarketing: (id) => set(s => ({
    marketing: s.marketing.map(m => m.id === id ? { ...m, active: !m.active } : m)
  })),

  setMarketingSpend: (id, spend) => set(s => ({
    marketing: s.marketing.map(m => m.id === id ? { ...m, spend } : m)
  })),

  startResearch: (id) => set(s => {
    const target = s.tech.find(t => t.id === id);
    if (!target || target.unlocked || target.researching) return {};
    // check prereq
    const prereqOk = s.tech.filter(t => t.unlocks.includes(id)).every(t => t.unlocked) || id === 'llm' && s.tech.find(t => t.id === 'ml')?.unlocked;
    if (!prereqOk && id !== 'llm') return {};
    return { tech: s.tech.map(t => t.id === id ? { ...t, researching: true } : { ...t, researching: false }) };
  }),

  freeResearch: (prompt) => set(s => ({
    events: [{ id: `e${Date.now()}`, date: s.date.toLocaleDateString('en-AU'), headline: `Research bet: "${prompt.slice(0, 48)}" — Mira estimates 21 days, 32% breakthrough chance`, effect: 'Free research queued (mock)', type: 'opportunity' as const }, ...s.events].slice(0, 8)
  })),

  createStealth: (focus) => set(s => {
    if (s.cash < 25000) return {};
    const name = `Stealth-${String.fromCharCode(65 + s.stealth.length)}`;
    const sc: StealthCompany = { id: `sc${Date.now()}`, name, focus, progress: 0, leakRisk: 8, detected: false };
    return { stealth: [...s.stealth, sc], cash: s.cash - 25000, events: [{ id: `e${Date.now()}`, date: s.date.toLocaleDateString('en-AU'), headline: `${name} launched in stealth — focus: ${focus}. Leak risk 8%`, effect: '-$25k setup', type: 'opportunity' as const }, ...s.events].slice(0, 8) };
  }),

  unlockHQ: (id) => set(s => {
    if (s.cash < 60000) return {};
    return { cash: s.cash - 60000, hqs: s.hqs.map(h => h.id === id ? { ...h, used: 1 } : h) };
  }),

  placeTile: (x, y, type) => set(s => {
    const costMap: Record<string, number> = { desk: 4000, meeting: 8000, break: 6000, lab: 12000, empty: -1500 };
    const tile = s.office.tiles.find(t => t.x === x && t.y === y);
    if (!tile) return {};
    const cost = costMap[type] ?? 0;
    const refund = tile.type !== 'empty' && type === 'empty' ? 1500 : 0;
    const actualCost = type === 'empty' ? -refund : cost;
    if (s.cash < actualCost) return {};
    const newTiles = s.office.tiles.map(t => t.x === x && t.y === y ? { ...t, type } : t);
    const desks = newTiles.filter(t => t.type === 'desk').length;
    const breaks = newTiles.filter(t => t.type === 'break').length;
    const meetings = newTiles.filter(t => t.type === 'meeting').length;
    const moraleBonus = Math.min(15, breaks * 3 + meetings * 2) - Math.max(0, (s.agents.length - desks) * 2);
    return {
      cash: s.cash - actualCost,
      office: { ...s.office, tiles: newTiles, moraleBonus },
      hqs: s.hqs.map(h => h.id === s.office.hqId ? { ...h, used: s.agents.length, capacity: 6 + desks } : h),
    };
  }),

  createCompany: (name, industry) => set(s => {
    if (s.cash < 45000) return {};
    const id = `co${Date.now()}`;
    return {
      cash: s.cash - 45000,
      companies: [...s.companies, { id, name, industry, hqId: s.office.hqId, productIds: [], foundedDay: s.tickCount }],
      selectedCompanyId: id,
      events: [{ id: `e${Date.now()}`, date: s.date.toLocaleDateString('en-AU'), headline: `🏢 Founded ${name} — ${industry} — $45k setup`, effect: `Holding now ${s.companies.length + 1} companies`, type: 'market' as const }, ...s.events].slice(0, 8),
    };
  }),

  selectCompany: (id) => set(s => {
    const co = s.companies.find(c => c.id === id);
    const firstProd = co?.productIds[0] || s.products.find(p => p.companyId === id)?.id || s.selectedProductId;
    return { selectedCompanyId: id, selectedProductId: firstProd };
  }),

  createProduct: (companyId, name, category) => set(s => {
    if (s.cash < 12000) return {};
    const pid = `p${Date.now()}`;
    const product: import('./types').Product = { id: pid, name, companyId, category, stage: 'building', progress: 0, quality: 50, bugs: 2, techDebt: 0, assignedAgents: [], users: 0, mrr: 0, rating: 0 };
    return {
      cash: s.cash - 12000,
      products: [...s.products, product],
      companies: s.companies.map(c => c.id === companyId ? { ...c, productIds: [...c.productIds, pid] } : c),
      selectedCompanyId: companyId,
      selectedProductId: pid,
      events: [{ id: `e${Date.now()}`, date: s.date.toLocaleDateString('en-AU'), headline: `📦 ${name} started — ${category} at ${s.companies.find(c=>c.id===companyId)?.name}`, effect: '-$12k seed', type: 'opportunity' as const }, ...s.events].slice(0, 8),
    };
  }),

  assignSupport: (count) => set(s => {
    const newStaff = Math.max(0, Math.min(8, count));
    const diff = newStaff - s.support.staff;
    return { support: { ...s.support, staff: newStaff }, burnRate: s.burnRate + diff * 5200 };
  }),

  executeDirtyOp: (type, targetId) => set(s => {
    const target = s.competitors.find(c => c.id === targetId);
    if (!target) return {};
    const hasLegal = s.agents.some(a => a.role === 'legal');
    const hasResearcher = s.agents.some(a => a.role === 'researcher');
    const opConfig: Record<string, { cost: number; risk: number; need: string }> = {
      sue: { cost: 15000, risk: 22, need: 'Legal' },
      spy: { cost: 10000, risk: 35, need: 'Legal or HR' },
      steal: { cost: 20000, risk: 48, need: 'Researcher + Legal' },
      hostile: { cost: 120000, risk: 60, need: 'Cash + $5M valuation' },
    };
    const cfg = opConfig[type];
    if (!cfg) return {};
    if (type === 'sue' && !hasLegal) return {};
    if (type === 'spy' && !hasLegal && !s.agents.some(a => a.role === 'hr')) return {};
    if (type === 'steal' && (!hasLegal || !hasResearcher)) return {};
    if (type === 'hostile' && (s.cash < cfg.cost || s.valuation < 5000000)) return {};
    if (s.cash < cfg.cost) return {};
    if (s.reputation < 20 && type !== 'spy') return {};

    // risk modified by reputation and legal skill
    const legalSkill = s.agents.filter(a => a.role === 'legal').reduce((m, a) => Math.max(m, a.skills.legal), 0);
    const riskMod = cfg.risk - Math.floor(legalSkill / 8) - (s.stealth.length > 0 ? 6 : 0);
    const success = Math.random() * 100 > riskMod;

    const opId = `do${Date.now()}`;
    let cashDelta = -cfg.cost;
    let repDelta = 0;
    let valDelta = 0;
    let competitorDelta: Partial<typeof target> = {};
    let eventHeadline = '';
    let eventEffect = '';
    let eventType: 'crisis' | 'opportunity' | 'market' = 'market';
    let newTech = s.tech;
    let newCompetitors = s.competitors;

    if (type === 'sue') {
      if (success) {
        const settlement = 35000 + Math.floor(Math.random() * 50000);
        cashDelta += settlement;
        repDelta = -6;
        competitorDelta = { valuation: Math.floor(target.valuation * 0.94) };
        eventHeadline = `⚖️ You sued ${target.name} — won $${(settlement / 1000).toFixed(0)}k settlement, their valuation -6%`;
        eventEffect = `Reputation -6, cash +$${(settlement / 1000).toFixed(0)}k`;
        eventType = 'opportunity';
      } else {
        cashDelta -= 20000;
        repDelta = -12;
        eventHeadline = `⚖️ Suit vs ${target.name} failed — countersued, you pay $${((cfg.cost + 20000) / 1000).toFixed(0)}k total`;
        eventEffect = 'Reputation -12, board pressure +8';
        eventType = 'crisis';
      }
    } else if (type === 'spy') {
      if (success) {
        const intel = `Stole ${target.name} roadmap — tech +30%`;
        newTech = s.tech.map(t => t.researching ? { ...t, progress: Math.min(100, t.progress + 30) } : t);
        repDelta = -4;
        eventHeadline = `🕵️ Spy in ${target.name} succeeded — ${intel}`;
        eventEffect = 'Research +30%, reputation -4';
        eventType = 'opportunity';
      } else {
        repDelta = -10;
        eventHeadline = `🕵️ Spy in ${target.name} caught — leaked to press`;
        eventEffect = 'Reputation -10, leak risk +20%';
        eventType = 'crisis';
      }
    } else if (type === 'steal') {
      if (success) {
        // unlock next locked tech instantly to 50% or unlocked
        const locked = s.tech.find(t => !t.unlocked && !t.researching);
        if (locked) newTech = s.tech.map(t => t.id === locked.id ? { ...t, unlocked: false, researching: true, progress: 60 } : t);
        cashDelta += 0;
        repDelta = -14;
        eventHeadline = `🧬 Stole patent from ${target.name} — ${locked?.name || 'tech'} now 60% (was locked)`;
        eventEffect = 'Reputation -14, lawsuit risk high';
        eventType = 'opportunity';
      } else {
        cashDelta -= 30000;
        repDelta = -18;
        eventHeadline = `🧬 Patent heist vs ${target.name} failed — FBI inquiry, -$30k legal`;
        eventEffect = 'Reputation -18, board pressure +12';
        eventType = 'crisis';
      }
    } else if (type === 'hostile') {
      if (success) {
        cashDelta = cashDelta; // already -120k, gain users
        const gainUsers = Math.floor(target.users * 0.35);
        const gainVal = Math.floor(target.valuation * 0.2);
        valDelta = gainVal;
        newCompetitors = s.competitors.filter(c => c.id !== targetId);
        // add users to first launched product if exists
        eventHeadline = `🏦 Hostile takeover of ${target.name} — acquired ${gainUsers.toLocaleString()} users`;
        eventEffect = `+$${(gainVal / 1_000_000).toFixed(1)}M valuation, reputation -20`;
        repDelta = -20;
        eventType = 'opportunity';
        // stash gain to apply to products below
        (newTech as any).__hostileGain = { gainUsers, gainVal };
      } else {
        cashDelta -= 50000;
        repDelta = -15;
        eventHeadline = `🏦 Takeover of ${target.name} failed — poison pill, -$50k extra`;
        eventEffect = 'Reputation -15, valuation -5%';
        valDelta = -Math.floor(s.valuation * 0.05);
        eventType = 'crisis';
      }
    }

    const newReputation = Math.max(0, Math.min(100, s.reputation + repDelta));
    const newPressure = success ? s.board.pressure : Math.min(100, s.board.pressure + (type === 'steal' ? 12 : type === 'hostile' ? 10 : 8));
    const hostileGain = (newTech as any).__hostileGain as { gainUsers: number; gainVal: number } | undefined;
    if (hostileGain) delete (newTech as any).__hostileGain;

    let finalProducts = s.products;
    if (hostileGain && success && type === 'hostile') {
      finalProducts = s.products.map(p => p.stage === 'launched' ? { ...p, users: p.users + hostileGain.gainUsers, mrr: (p.users + hostileGain.gainUsers) * 26 } : p);
    }

    const newValuation = s.valuation + valDelta + (hostileGain?.gainVal || 0);

    return {
      cash: s.cash + cashDelta,
      valuation: newValuation > 0 ? newValuation : s.valuation,
      reputation: newReputation,
      board: { ...s.board, pressure: newPressure },
      tech: newTech,
      competitors: type === 'hostile' && success ? newCompetitors : s.competitors.map(c => c.id === targetId && competitorDelta.valuation ? { ...c, valuation: competitorDelta.valuation as number } : c),
      products: finalProducts,
      dirtyOps: [...s.dirtyOps, { id: opId, type, targetId, targetName: target.name, cost: cfg.cost, risk: riskMod, status: (success ? 'success' : 'failed') as import('./types').DirtyOp['status'] }].slice(-6),
      events: [{ id: `e${Date.now()}`, date: s.date.toLocaleDateString('en-AU'), headline: eventHeadline, effect: eventEffect, type: eventType }, ...s.events].slice(0, 8),
    };
  }),
}));
