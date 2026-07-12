---
name: engine-godot
description: Use when working in a Godot project with scenes, nodes, resources, signals, GDScript, C#, shaders, GDExtension, or Godot performance.
---

# Godot

Verify the project's Godot version before relying on version-sensitive APIs.

- Reference lookup order: exact VERSION, then breaking/deprecated changes, then relevant module or plugin documentation.
- Track resource lifetime across acquisition, async work, scene or world teardown, cancellation, ownership transfer, release, and error paths. Before owner teardown, cancel pending work and unsubscribe callbacks, events, signals, delegates, and listeners; callbacks must not access a dead owner. Do not retain invalid engine objects, handles, or native resources.

- Prefer scenes, nodes, resources, and signals when they match existing project patterns. Keep node ownership, tree lifetime, and signal connections explicit.
- Prefer reusable composed scenes with explicit exported or injected references over duplicated node hierarchies; keep each instance's required references valid after scene changes.
- Use resources for reusable authored data and scene instances for composed behavior. Avoid hidden global state when injected references or groups are clearer.
- Use resource UIDs for durable authored-resource references when project tooling supports them; do not replace working project reference conventions solely for this.
- Use typed GDScript where it improves safety without obscuring Godot idioms. Keep await, signal, and deferred-call lifetime hazards visible.
- Deep-copy mutable resources before per-instance mutation; otherwise shared resource state can leak between instances.
- Prefer typed signals and cached node references when lifetime is clear; validate cached references across tree changes.
- For multiplayer, define server authority; use reliable delivery for critical ordered events and rate-limited high-rate state updates for transient data.
- Treat navigation completion, avoidance, and rebake invalidation as explicit states; do not assume a path remains valid.
- Pool short-lived audio players where profiling supports it, route through buses, and use completion signals for cleanup or sequencing.
- Respect main-thread and rendering constraints. Profile before changing process modes, allocation strategy, or rendering features.
- Keep C#, GDExtension, shaders, and native boundaries narrow; use them for measured need, not assumed performance.
- Validate imported assets, input actions, exported properties, and resource references through project-native tooling.
