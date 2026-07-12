---
name: ui-accessibility-localization
description: Use when designing or reviewing HUDs, menus, player flows, input states, accessibility support, player text, or localization behavior.
---

# UI, Accessibility, And Localization

UI presents game state and player choices. It must not become the authoritative owner of gameplay state.

## UX

- Define player goal, information hierarchy, primary action, alternate input, success, loading, empty, disabled, error, confirmation, and recovery states. Surface urgent state before secondary detail.
- Define flow contracts for each screen or sequence: entry source, required information and action, Back/Cancel result, interruption behavior, saved or discarded state, success destination, and recovery after failure or reload. Keep these results consistent across input methods.
- Require a HUD element to name its live decision or action; remove, defer, or contextualize elements that cannot pass this necessity test.
- Categorize every game fact as always visible, contextual/on demand, notification, discoverable, or deliberately hidden. Define HUD zones, safe margins, and per-state visibility; center play area remains clear unless a brief critical rule overrides it.
- Set an attention limit: cap simultaneous persistent HUD elements, transient alerts, animation, and screen coverage for each gameplay state. Queue or collapse lower-priority notices rather than competing with urgent play.
- Onboard one concept at point of need: show action, let player perform it safely, confirm result across relevant channels, then remove or archive guidance. Never require reading a tutorial to recover basic controls.
- Design for mouse, keyboard, controller, touch, and remapping as relevant to project targets.
- Preserve focus behavior and provide visible focus. Never require hover-only or pointer-only interaction.
- Make layouts responsive to aspect ratio, safe areas, text expansion, and user scaling.
- Pair consequential feedback across visual, audio, haptic, and text channels where available; align onset with input/result timing and let players reduce noncritical effects.
- When changing an established UX pattern, audit every current use, migration state, input path, help text, and saved preference it affects; retain consistency unless player benefit outweighs retraining cost.

## Accessibility

- State accessibility commitment as project tier or applicable platform/standard, then verify required features against it. Use more than color for meaning; provide sufficient contrast, scalable text, readable typography, captions or text alternatives, remappable controls, motion reduction, and adjustable feedback where relevant.
- Avoid time-critical interaction without an accessible alternative when the game does not require it.
- Replace required simultaneous multi-button input with sequential, remappable, or toggle alternatives; offer QTE skip/auto-complete and adjustable timing. Make hold duration, repeated presses, and repeat delay adjustable or replaceable with a single press where feasible.
- Offer cognitive options where relevant: reduced prompts or clutter, stable layouts, plain critical language, pause/extend time, and confirmation for irreversible actions. Destructive actions need clear consequence, explicit confirmation, and undo or recovery when feasible.
- Audit full flows with keyboard or controller, settings enabled, color-independent cues, readable text at target distances, captions, timing alternatives, and no audio-only instructions.
- Expose platform accessibility semantics for each relevant control or status: name, role, state, value, focus, and live updates.
- Provide distinguishable alternatives for spatial, directional, and status data, including a non-audio fallback.

## Localization

- Externalize player-facing strings through existing project text systems.
- Use stable IDs, preserve placeholders and markup safely, and provide translator context.
- Plan for plural rules, grammatical variation, font coverage, RTL, and expansion before layout hardens.
- Test pseudolocalized expanded strings before layouts harden. Define locale-aware date, time, number, currency, measurement, name, and sorting formats; do not assume one reading order or separator convention.
- For RTL support, mirror navigation order, HUD zones, progress/scroll direction, and directional icons or art when their meaning is directional; preserve assets whose world meaning must not flip and mark that exception.
- Do not encode grammar or player-visible sentences through string concatenation.
- Define missing-locale fallback, test representative long/RTL locales, and review cultural references, symbols, gestures, and idioms before release.
- For voiced content, retain line IDs, speaker/emotion/context, timing limits, subtitle/caption relationship, and locale-specific retake or fallback needs.

## Validation

- QA critical flows across inputs, resolutions, accessibility settings, locale fallbacks, text expansion, RTL where supported, and voice/subtitle combinations. Record player-visible failures, not only layout defects.
