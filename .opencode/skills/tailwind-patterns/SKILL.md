---
name: tailwind-patterns
description: Tailwind CSS v4 principles. CSS-first configuration, container queries, modern patterns, design token architecture.
---

# Tailwind CSS Patterns (v4)

> This repo uses Tailwind v4. Configuration is CSS-first via `@theme`. There is no `tailwind.config.js`.

## When to use
Configuring Tailwind v4, theming, design tokens, container queries, responsive or dark-mode work.

## v4 essentials
- Theme in CSS: `@theme { --color-primary: ...; --font-sans: ...; }`
- Oxide engine, native JIT, automatic content detection. No manual purge config.
- Prefer semantic tokens (`--color-primary`, `--color-surface`) over raw palette values in components.
- OKLCH preferred for perceptually uniform colour.

## Patterns
- **Layout:** `flex items-center justify-center`, `flex flex-col gap-4`, `grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]` for responsive auto-fit; Bento/asymmetric grids over symmetric 3-col.
- **Responsive:** mobile-first base, then `sm: md: lg: xl: 2xl:`. Component-level responsiveness via `@container` + `@sm:`/`@md:` variants.
- **Dark mode:** `dark:bg-zinc-900`, `dark:text-zinc-100`, `dark:border-zinc-700` with `next-themes` provider.
- **Type scale:** `text-xs` labels → `text-base` body → `text-xl+` headings. Fonts via `next/font`, wired to `--font-sans`/`--font-mono`.
- **Motion:** `transition-colors duration-150`, `hover:scale-105 transition-transform`, built-in `animate-spin/ping/pulse/bounce` only.

## Anti-patterns
- Arbitrary values everywhere instead of tokens; `!important`; inline `style=`; dynamic template-string class names (breaks the compiler — use full class literals or `cva`); mixing v3 JS config with v4 CSS-first; heavy `@apply`.

## Verify
`npm run build` compiles CSS, Playwright screenshots at 375/768/1440, no dynamic class construction in `src/`.
