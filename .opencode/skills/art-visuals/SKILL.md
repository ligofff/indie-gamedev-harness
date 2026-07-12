---
name: art-visuals
description: Use when setting visual direction, specifying or auditing game art, planning technical art, VFX, shaders, rendering constraints, or asset production.
---

# Art And Visuals

Visual direction serves readability, tone, and production reality. Define visual-language dimensions: desired player feeling, shape language, palette/value hierarchy, material and lighting rules, composition/camera behavior, motion/VFX character, reference qualities, and explicit exclusions.

## Visual Language

- Define mood by gameplay state, not one global adjective: exploration, threat, victory, failure, safe hub, and menu each need value, saturation, lighting, motion, and density rules that preserve priority.
- Specify shape grammar for characters, threats, props, spaces, and UI: dominant geometry, silhouette cue, hero versus supporting forms, and emotional meaning. Apply same grammar across assets unless a deliberate contrast signals danger, faction, or interaction.
- Make environments logically legible: structure follows climate, materials, labor, history, resource flow, and current use. Landmarks, wear, routes, and prop placement should explain navigation and story while supporting play.
- Assign typography roles: display/brand, headings, body/dialogue, labels, and numeric/data. State hierarchy, weight, size/spacing behavior, contrast, language coverage, and fallback families; decorative faces never carry critical small text.

## Assets

- Specify intended use, scale, camera distance, silhouette, pivot or origin, animation needs, dimensions, frame rate, texture/material budget, import constraints, naming, format, and source/license status.
- Keep asset metadata and concrete settings with assets or import configuration, not duplicated documents.
- Audit consistency across style, scale, lighting, UI contrast, animation timing, and platform budgets.
- Track provenance. Do not treat generated, purchased, or third-party assets as license-free.
- Reuse palettes, materials, rigs, modular kits, and effects before proposing new assets; state why an existing asset cannot serve when creating one-off work.
- Categorize budgets by character, environment, UI, VFX, animation, and audio-visual support; track relevant geometry, texture memory, draw calls, animation, shader/overdraw, and disk/streaming costs.

## Readability

- Prioritize player, threat, objective, interactable, and navigable-space readability over decorative detail.
- Use value, shape, motion, labels/patterns, and sound together; do not rely on color alone. Preserve semantic meaning under color-vision, low-vision, motion-reduction, and reduced-effects settings.
- Design VFX and animation for gameplay timing, telegraphing, and input feedback.

## Technical Art

- Measure rendering cost on target hardware before optimizing or adding complexity.
- Keep shader parameters named and artist-tunable. Control texture samples, branches, precision, variants, and overdraw according to measured budget.
- Plan fallback tiers when a visual feature is not available or affordable on all targets.
- Keep engine-specific implementation details in relevant engine skill.
