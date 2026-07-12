---
name: game-design
description: Use when defining or reviewing mechanics, loops, balance, progression, economy, encounters, level flow, live events, rewards, or player choices.
---

# Game Design

Start from intended player experience, audience, pillars, scope, and production limits. A mechanic is useful when it creates a meaningful repeated choice, readable consequence, and reason to continue playing.

## Systems

- Define core loop before supporting systems. Each step should create a reason for the next.
- Explain player verbs, resources, information, tradeoffs, failure, recovery, feedback, and feedback loops (reinforcing and balancing).
- For each mechanic, state normal result, failure, interruption, simultaneous effects, invalid target/input, boundary/cap, and recovery result. Define priority, stacking, immunity, tick cadence, and ownership where systems meet.
- Use an existing project-native interaction matrix, or create one only when demonstrated interaction complexity, continuity, decision, or handoff need warrants it: rows and columns are effects, tools, states, or actors; each cell names result, precedence, and exception. Omit combinations that cannot occur.
- Prefer a few interacting systems over isolated feature lists.
- Protect player agency. Avoid optimal strategies that make choices fake.
- Test repeatable exploits, dominant loops, stall tactics, input buffering abuse, resource duplication, and incentives that reward tedious or antisocial play. Preserve expressive mastery; block or rebalance degenerate outcomes.
- Make rules legible through feedback, pacing, and telegraphing rather than hidden documentation.
- State reward expectation: what action earns, how soon feedback arrives, what choice reward reinforces, and whether reward is guaranteed, variable, or player-selected.
- Map player journey at moment, encounter, session, and return scales. Give each scale a hook, a payoff, and a natural stopping point; do not rely on compulsion to bridge them.

## Balance And Progression

- Put concrete values, formulas, ranges, and tuning data in project-native assets or configuration.
- Express equations with named variables, units, valid ranges, clamps or rounding, and a worked example; name tuning knobs and intended player-facing effect. Example: `damage = base_damage × (1 + power), power ∈ [0, 1]`; record expected result at representative inputs.
- Classify each tuning knob as additive, multiplicative, threshold, probability, cadence, cap, or cost; state safe range, owner, and interactions before tuning it.
- Separate difficulty axes such as execution, information, resource pressure, time pressure, and enemy complexity. Escalate deliberately; identify where axes compound and provide a recovery or relief valve.
- Teach one new verb, rule, or enemy behavior safely before combining it with another demand. First use proves action; next use tests recognition; later encounters combine only previously taught pieces.
- Set time-to-kill and time-to-complete targets for representative player power, skill, and difficulty cases. Derive health, damage, wave size, timer, checkpoint, and reward pacing from these anchors; verify weak, expected, and optimized play do not break them.
- For each reward, state expectation, minimum floor, maximum ceiling, delivery timing, and duplicate/bad-luck protection where random. Avoid reward ranges that make ordinary outcomes feel like failure.
- Identify sources, sinks, stockpiles, conversion rates, caps, exploits, and inflation risk for every economy.
- Test dominant strategies, runaway snowballing, dead ends, grind walls, and incentives that reward unfun behavior.
- Progression should add decisions or mastery, not only larger numbers.
- State expected difficulty curve, skill checks, recovery paths, and accessibility impact.

## Levels And Encounters

- Design routes, landmarks, sightlines, safe spaces, escalating pressure, optional discovery, and readable encounter roles.
- Use pacing contrast. Continuous intensity flattens tension.
- Map level pacing as beats of anticipation, commitment, consequence, recovery, and reflection; specify intended duration or trigger and fallback when player fails, stalls, or skips content.
- Ensure optional content rewards curiosity without making critical progress obscure.

## Live Events

- Use events only when they serve current pillars and remain optional, understandable, and completable without coercive schedules or spending.
- State cadence, entry and exit conditions, reward cap, catch-up path, and permanent or returning access. Never use fear of missing out, opaque odds, or pressure loops as primary engagement.
- For monetized content, disclose price, odds and their scope before purchase, time limits and reason, and non-paid fallback. Never sell relief from intentionally created friction or hide urgency behind ambiguous timers.

## Scope And Evidence

- Distinguish pillar-critical work from polish and nice-to-have work.
- Prefer smallest playable version that can validate a design claim.
- Define observable acceptance conditions and playtest questions.
- Use telemetry only when it changes a future decision; respect player privacy and avoid manipulative retention design.
