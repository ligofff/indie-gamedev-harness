---
name: engine-lightweight-cpp
description: Use when working in SFML, Raylib, or lightweight C/C++ game projects involving rendering, audio, input, assets, build integration, or performance.
---

# Lightweight C And C++ Engines

Use engine facilities directly and keep program architecture small enough to trace.

- Reference lookup order: exact VERSION, then breaking/deprecated changes, then relevant module or library documentation.
- Track resource lifetime across acquisition, async work, scene or world teardown, cancellation, ownership transfer, release, and error paths. Before owner teardown, cancel pending work and unsubscribe callbacks, events, signals, delegates, and listeners; callbacks must not access a dead owner. Do not retain invalid engine objects, handles, or native resources.

- Make resource ownership and cleanup explicit. Prefer RAII in C++ and clear init/shutdown ownership in C.
- Separate platform loop, input collection, simulation, rendering, audio, and persistence enough to keep timing and state understandable.
- Drain and handle platform events every frame; do not infer input or window state from stale state.
- Handle close, resize, focus gain/loss, and device events explicitly; clear or reconcile transient input on focus loss.
- Update viewport, render targets, UI layout, and camera/view aspect or bounds on resize; do not stretch stale dimensions.
- Load assets outside frame loop. Keep SFX instances separate from streamed music, and release both before audio/window shutdown.
- Use fixed or variable timestep deliberately; document interpolation and frame-rate assumptions in code when they affect behavior.
- Validate asset paths, load failures, window/audio availability, and platform-specific behavior rather than assuming development-machine conditions.
- Keep build configuration, compiler flags, include boundaries, and third-party libraries minimal and reproducible.
- Profile before optimizing. Avoid premature custom allocators, render batching, or threading frameworks.
