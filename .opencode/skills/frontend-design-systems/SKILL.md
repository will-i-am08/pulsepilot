---
name: frontend-design-systems
description: Workflow for generating production-quality frontend interfaces using React, Tailwind CSS, and shadcn/ui with strong focus on spacing, alignment, readability, and non-generic visual design.
---

# Frontend Design Systems

## When to use
Building React interfaces, SaaS dashboards, landing pages, reusable UI systems, responsive layouts, or improving frontend polish in this repo (Next.js 16 + React 19 + Tailwind v4).

## When NOT to use
Backend-only work, raw HTML prototypes with no design requirements, non-React stacks.

## Principles
1. **Spacing first.** Consistent scale, breathing room, clean alignment. Never cramped or uneven padding.
2. **Strong hierarchy.** One clear primary action per view. Typography scale + contrast + layout structure guide attention.
3. **No AI-slop.** Avoid: purple/blue gradients everywhere, glassmorphism soup, 3-column symmetric grids, excessive shadows, emoji icons in prod UI.
4. **Component-driven.** Extract when a class combo repeats 3+ times. Prefer React components over `@apply` soup.
5. **Responsive early.** Mobile-first base, then `sm:`/`md:`/`lg:` overrides. Verify at 375px and 1440px via Playwright screenshots.

## Execution
1. Clarify layout goals, branding, target surface (dashboard / landing / admin / mobile-first).
2. Build layout hierarchy with semantic tokens (primary, surface, muted) — not raw hex scattered through JSX.
3. Use shadcn/ui + Radix as the foundation; customise via CSS variables, don't fork internals.
4. Keep Tailwind utilities organised; use `cn()` (clsx + tailwind-merge) and `cva` for variants.
5. Dark mode via `next-themes` + `dark:` variants.
6. Validate: Playwright screenshot at two viewports, keyboard nav, contrast check.

## Output
Production-quality React components, clean Tailwind structure, reusable sections, responsive + accessible by default.
