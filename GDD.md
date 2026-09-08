# STEALTH MODE — Game Design Document
### STEALTH MODE: The AI Startup Tycoon | v0.1 — 28/08/2026 | For Master Will / Pulse Social Media
> **Stack:** Web First (Supabase + Netlify) → Steam Port | **Engine:** Web MVP = React + Next.js + Supabase Realtime | Steam = Unity or Godot (shared design)

---

## 1. HIGH CONCEPT

**One-Sentence Fantasy:** *Build a chaotic tech empire from a laptop in 2026 — hire real AI agents as staff who research, code, and scheme for you, while 500+ simulated competitors try to copy, poach, and crush you.*

**Elevator Pitch:**
> It's *Game Dev Tycoon* meets *Silicon Valley (HBO)* meets *Football Manager* — but your staff are actually LLM agents you can talk to. Run unlimited companies (plus stealth shell corps), invent anything from SaaS to biotech, and survive an AI-driven living market where trends, scandals, and recessions are generated dynamically. No win screen — just endless scaling and leaderboard dominance. Satirical, isometric, and just realistic enough to hurt.

**Design Pillars:**
1.  **Agents Are People** — Every hire is a persistent character with skills, morale, and a brain (LLM for your key staff, simulated for the masses).
2.  **The Market Fights Back** — Competitors are not window dressing; they have products, users, cash, and grudges.
3.  **Chaotic Realism** — Keep finance fun (runway/burn, not GAAP), but products have real tech debt, bugs, and hype cycles.
4.  **Anything Goes** — If a real founder could do it (steal code, hostile takeover, stealth startup), you can.

---

## 2. CORE LOOPS

### 2.1 Second-to-Second (The Founder Loop)
`Assign Task → Watch Progress → React to Event → Re-assign` — all with pausable real-time.

- Player is always allocating agent time across: Research / Build / Market / Ops.
- Tick rate: 1 in-game day = 10 real seconds at 1x. Speeds: Pause, 1x, 2x, 4x.
- Real-Time Pausable (like Cities Skylines) is non-negotiable for founder fantasy.

### 2.2 Hour Loop (Sprint Loop)
`Research Unlock → Staff Sprint → Build Feature → Launch MVP → Marketing Push → Users → Revenue/Data → Iterate or Pivot`

### 2.3 Campaign Loop (Empire Loop)
`Single Product → Product-Market Fit → Second Product/Company → Holding Company → Multiple HQs → Market Dominance → Stealth Bets → Leaderboard`

**What keeps it addictive at hour 10:**
- New industries unlock (start SaaS, unlock Hardware/Bio)
- Competitors launch a direct rival the same week as you
- Your best engineer is being poached — counter-offer or let him walk?
- AI Event: "EU bans generative ads" wipes your revenue — pivot?

---

## 3. WORLD & TONE

- **Setting:** Real world, 2026-today start. Calendar advances. Real tech exists; you invent the future.
- **Tone:** Silicon Valley Satire — witty, darkly honest, not absurd. Think *The Dropout* meets *HBO's Silicon Valley*. Competitors have names like "Nexora" and "Blip AI", press headlines roast you.
- **Map:** Global, not city-locked. HQs in SF, London, Singapore, etc. affect hiring pools, costs, and market access.

---

## 4. AI AGENT SYSTEM — The Heart (Real LLM Agents)

This is your moat, Sir. No tycoon game has done this properly.

### 4.1 Two-Tier Architecture (To Control Cost)

| Tier | Who | Brain | Cost | Count |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Principals** | Your direct reports / Heads (CTO, Head of Research, CMO) | Real LLM (Muse / GPT via API) | ~$0.01-0.05 / interaction | 3-7 active at once |
| **Tier 2: Workforce** | Engineers, designers, marketers, sales | Simulated stats + LLM *summarised* output | Near-zero | Unlimited |

**How it feels:** You talk directly to your Tier 1s. e.g., You prompt your CTO: *"We need to beat Nexora to LLM-video. What's the trade-off if we cut QA by 2 weeks?"* — she replies in character, with her stats influencing the answer quality. She then delegates to her simulated team; you see tickets move on a Kanban board.

This gives you the magic of real chat without a $500/month API bill.

### 4.2 Agent Model `agents` Table (Supabase)

```sql
id uuid, name text, role enum, tier int,
skills jsonb -- {coding: 78, research: 92, design: 45, marketing: ...}
traits text[] -- ['Perfectionist', 'Loyal', 'Burns Out Fast']
morale int 0-100, loyalty int 0-100, salary int,
personality_prompt text, -- system prompt for LLM Tier 1
current_task_id uuid, hq_id uuid
```

- **Stats influence LLM quality:** A 40-coding engineer hallucinates more, gives worse estimates. A 95-researcher finds breakthroughs faster.
- **Morale/Loyalty (Light Drama):** Overwork → burnout → sick leave. Underpay vs market → poach risk. You get a Slack-style DM: *"Hey, Nexora offered me 30% more. Can we talk?"*

### 4.3 Roles — All Possible (Unlocked Over Time)
Phase 1: Researcher, Engineer, Designer, Marketer
Phase 2: Product Manager, Sales, HR, Finance, Legal, Data Scientist
Phase 3: Wildcard — Influencer Manager, Lobbyist, Hacker (for dirty play)

### 4.4 What Agents Do Autonomously
- Tier 2s progress tasks on their own when assigned (Assign & Wait is preserved).
- Tier 1s can be set to "Auto-pilot" — e.g., "Keep researching cost reductions while I'm focused on launch."

---

## 5. COMPANIES & HOLDING STRUCTURE

- **Unlimited + Stealth:** Player starts with 1 startup. After PMF, can found/spin-off new cos. Holding Company view shows portfolio.
- **Stealth Mode:** Create shell company to research a rival's space without them noticing (if you have a good Legal/HR team, lower leak chance). Leak chance = f(loyalty, competitor spy level).
- **Industries — Any Business:**
  - **Track A (Start):** SaaS, AI Tools, Social Apps, Marketplaces
  - **Track B (Unlock via research/capital):** Hardware, Games, Fintech, BioTech, Climate, Defence
  - Each has different regulatory / capital / talent demands.

---

## 6. PRODUCT SYSTEM (Deep Sim, Assign & Wait)

### 6.1 Building
Not drag-and-drop. You create a Product, pick a category, then allocate agents to sprints:

`Product: "PulseAI" (AI Social Scheduler) → Features: [Auto-caption, Virality Predictor, Competitor Spy]`

Each feature has: `spec_quality, build_progress, bug_count, tech_debt`.

- **Assign & Wait + Decisions:** When you rush, your CTO warns: *"We can ship in 14 days with 30% bug risk, or 28 days clean. Your call."* You choose speed vs quality.
- **Deep Sim:** After launch, you face: server costs scaling with users, outages if you under-hired infra, tech debt slowing next feature by x%.

### 6.2 Lifecycle
MVP (barely works) → PMF (retention > threshold) → Scale (hiring + infra) → Iterate or Milk → Sunset or Pivot.

---

## 7. RESEARCH & TECH TREE (Hybrid Tree + Free)

- **Structured Tree:** Core trunk: `Cloud → ML → LLMs → Multimodal → AGI → ASI`. Branches for each industry.
- **Free Research:** At any time, prompt your Head of Research: *"Find a cheaper way to do video inference."* — LLM generates a 3-option research bet with cost/time/risk.
- **Steal & Copy:** Hire ex-competitor staff → chance to unlock their tech at 50% cost but with lawsuit risk.
- **Failure is real:** 20-30% of free research bets fail or yield a lesser breakthrough. This is where risk/reward sings.

---

## 8. THE MARKET SIMULATION — As Big As Possible (500+ Competitors)

This is the hardest engineering problem. We don't simulate 500 LLMs. We simulate 500 *companies* with lightweight agents.

### 8.1 Architecture: "Headline Sim"
In Supabase:
- `companies` (id, name, ceo_personality, cash, valuation, focus_industry, aggression 0-100)
- `products` (company_id, quality, users, revenue, hype)
- Each tick (1 in-game week), a server function (Edge Function + pg_cron) updates all comps:

```
For each competitor:
  cash -= burn_rate (staff * avg_salary + infra)
  research_progress += f(R&D staff)
  if ready_to_launch: launch product (quality = f(talent + time_spent))
  users += growth_formula (product_quality vs market_trend vs marketing_spend)
  if aggressive & player_is_threat: trigger action (copy feature, poach, sue)
```

- **Cost:** One Edge Function sweep per week tick = ~500 row updates. Trivial for Supabase.
- **Illusion of Depth:** Player only *sees* top 20 rivals in detail + 3 direct competitors in full detail. Rest are headlines: *"Nexora raises $40M at $400M valuation"*.
- **Aggressive Behaviour:** If your product overlaps theirs by >60%, they will: undercut pricing (30% chance), launch copycat in 4-8 weeks, try to poach your highest-skill agent.

### 8.2 Hype & Trends (AI-Driven Events)
- Base trends on a 12-quarter hype cycle: AI Video is hot now, will cool in 6 months.
- **AI-Driven Events:** Nightly (or weekly) cron calls LLM to generate 1-3 world events based on current market state:
  > *"Prompt: Given these top 5 companies and products, generate a plausible tech news event for next quarter. Return JSON {headline, affected_industry, effect}."*
  Effects: `{"affected": "AdTech", "user_growth_multiplier": 0.6, "duration_weeks": 8}`
- This gives infinite, coherent news without hand-writing 1000 events.

---

## 9. CUSTOMERS & MARKETING (Active Marketing)

- **Users are not auto.** Product launches with 0 users.
- **Active Channels (you allocate marketer agents + budget):**
  - Paid Ads (fast users, high churn, burns cash)
  - Content / Social (slow, sticky, needs Designer+Marketer)
  - Influencers (spike, risky)
  - Enterprise Sales (needs Sales team, long cycle, huge LTV)
- **Full Funnel (Light):** `Impressions → Signups → Active Users → Paying Customers → Churn`. You see this funnel per product.
- **Reviews & Support:** Dropping support staff → bug reports pile up → public rating drops → churn +20%.

---

## 10. ECONOMY & FUNDING (Any Funding, Keep It Fun)

- **Start:** Choice — Bootstrap ($50k), Angel ($200k for 10%), or Grant.
- **Any Funding:** At any time, open Funding UI:
  - VC Pitch (give up equity for cash, gain board pressure: "Hit 10k MRR in 90 days or we replace you")
  - Bank Loan (no equity, but monthly repayments)
  - Crowdfunding / Revenue Share
- **Keep It Fun Finance:** You see: Cash, Burn Rate, Runway (months), MRR, Valuation. No double-entry ledger.
- **Board Pressure (if VC):** If you miss targets, board can block stealth projects or fire you (game over → restart as new founder with reputation debuff).

---

## 11. OFFICES & HQ — Multiple HQs (Isometric 3D)

- **Visual:** Isometric office like Startup Company / Two Point Hospital. Click to place desks, meeting rooms, break areas.
- **Multiple HQs:** SF (high talent, high cost), Lisbon (cheap, mid talent), Bangalore (scale engineering). Each HQ has its own hiring pool and morale.
- **Office affects morale:** No break room → -10% productivity. Good office → +10% retention.

---

## 12. PROGRESSION & ENDGAME — Endless 100+ Hours, Sandbox Forever

- **No hard win.** Milestones: PMF → $1M ARR → Unicorn ($1B) → Decacorn.
- **Prestige:** After unicorn, can "Exit" to start new game+ with permanent perk (e.g., "Serial Founder: +10% fundraising success").
- **Fail States (Balanced):** Bankruptcy (cash 0 and no funding), Fired by board, Hostile takeover.
- **Leaderboards:** Global valuation & "Time to Unicorn" speedrun. Web version posts to Supabase `leaderboard` table. Is your 4-year unicorn top 10%?

---

## 13. DIRTY PLAY — Anything Goes

Unlocks after $1M ARR:
- **Legal:** Patent troll, Sue for IP theft (if you have proof)
- **Intel:** Hire ex-staff to steal, Plant spy (high risk/high reward)
- **Market:** Predatory pricing, Acquire & kill competitor
- All carry **Risk Score** — caught? Fine + reputation hit + key staff morale crash.

---

## 14. ART, UI & AUDIO

- **Art Style:** Isometric 3D, clean vector/cel-shaded — *Monument Valley* cleanness meets *Two Point* charm. Satirical flavour in copy, not in visuals.
- **UI Vibe:** Slick dashboards (Linear/Notion). Dark mode default. Isometric office is a *view*, not the main UI.
- **Inspiration:** Startup Company (isometric), Game Dev Tycoon (loop clarity), but distinctly modern.
- **Audio:** Lo-fi startup beats, Slack notification pings, subtle office ambience per HQ.

---

## 15. TECH STACK

**Web MVP (Phase 1):**
- Frontend: Next.js 14, React, Tailwind, PixiJS or Phaser for isometric office
- Backend: Supabase (Postgres + Auth + Realtime + Edge Functions + pg_cron)
- Realtime: Supabase Realtime for tick updates, agent progress bars
- LLM: Muse API for Tier 1 agents, with strict token budgeting + caching

**Steam Port (Phase 2):**
- Unity or Godot, reusing Supabase backend via REST. Web version becomes demo/funnel.

**Performance Note:** Headline Sim (Section 8) is the key to "As Big As Possible" without $10k/month infra.

---

## 16. MONETISATION — Paid Steam Game (with Web Funnel)

Hormozi lens, Sir: Money follows value.

- **Web:** Free demo (first 2 in-game years capped) → Email capture → Wishlist CTA for Steam. Optional $9/mo "Founder Pro" for unlimited sandbox + more LLM chat.
- **Steam:** $19.99 - $24.99 one-time (sweet spot for tycoons). No predatory IAP. DLC later: Biotech Pack, Crypto Chaos Pack.
- **Why this works:** Web is your Core Four content engine — streamers play free web version, funnel to Steam. Volume negates luck.

---

## 17. MVP vs FULL VISION — Roadmap

### MVP (6-8 weeks, playable)
- 1 HQ (SF), 1 company at a time, 4 roles, 15 competitors (headline sim), SaaS-only, one funding path (Angel), Assign & Wait + Deep Sim (lite), 1 LLM Tier 1 (CTO), AI Events (pre-written 10, not generative yet)
- **Goal:** Prove the loop is addictive.

### V1 (3-4 months)
- 3 HQs, unlimited companies + 1 stealth slot, all roles, 100 competitors, hybrid tech tree, full funding + board, active marketing funnel, generative events, 3 LLM principals, leaderboards

### V2 (Steam)
- 500+ comps, all industries, dirty play, full isometric office builder, mod support

---

## 18. RISKS & MITIGATIONS

| Risk | Mitigation |
| :--- | :--- |
| LLM cost spirals | Two-tier system + per-day token caps + cache |
| Market sim is boring | Aggressive rivals + weekly player-targeted action |
| Scope creep to everything | Strict MVP gate — if not in MVP list, it waits |

---

## 19. NAME OPTIONS (Surprise Me Brief)

1.  **Stealth Mode** — perfect for stealth corps mechanic
2.  **Unicorn Inc.** — satirical, memorable
3.  **Headcount** — double meaning (staff + beheading rivals)
4.  **Paper Unicorn** — valuation satire
5.  **Founder Protocol**
6.  **The Burn Rate**
7.  **Hype Cycle**
8.  **Cap Table** — insider, sticky
9.  **Empire Mode**
10. **Artificial Empire** — nods to AI agents

Recommendation, Sir: **STEALTH MODE** or **HEADCOUNT** — both brandable, both hint at the Anything Goes promise.

---

## 20. NEXT STEPS

1.  **Approve GDD v0.1** — flag anything to change
2.  I scaffold the Supabase schema + Next.js shell (with isometric placeholder) in `/game`
3.  Build MVP Tick Loop + 1 LLM Agent (CTO) + 15-comp Headline Sim
4.  Playtest the first sprint loop

Tell me which name you favour and if the MVP scope sits right, Master Will — I'll have the repo scaffolded by tonight.
