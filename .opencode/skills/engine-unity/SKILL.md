---
name: engine-unity
description: Use when working in a Unity project with C#, scenes, ScriptableObjects, Addressables, DOTS, Jobs, Burst, shaders, UI, or Unity performance.
---

# Unity

Verify Unity version, render pipeline, input system, and package set before choosing APIs.

- Reference lookup order: exact VERSION, then breaking/deprecated changes, then relevant module or package documentation.
- Track resource lifetime across acquisition, async work, scene or world teardown, cancellation, ownership transfer, release, and error paths. Before owner teardown, cancel pending work and unsubscribe callbacks, events, signals, delegates, and listeners; callbacks must not access a dead owner. Do not retain invalid engine objects, handles, or native resources.

- Follow existing scene, prefab, component, and ScriptableObject conventions. Keep ownership and lifecycle across Awake, OnEnable, Start, Update, disable, and destruction explicit.
- Prefer component composition over deep MonoBehaviour inheritance. Keep authored content in ScriptableObjects and behavior in components where this matches project conventions.
- Cache required component lookups at defined lifecycle points and inject dependencies where caller ownership is clearer; validate cache lifetime across scene and object changes.
- Check UnityEngine.Object references with Unity-aware null/destroyed-object semantics before use; CLR null checks alone can retain destroyed-object hazards.
- Choose MonoBehaviour or ECS from current workload and project conventions. DOTS, Jobs, and Burst need measured data-oriented benefit and clear ownership, not novelty.
- Treat Addressables and asynchronous loading as lifecycle work: handles, cancellation, errors, release, catalog versions, and fallback behavior matter.
- Keep managed allocations and main-thread work out of measured hot paths. Profile player builds on target hardware.
- Dispose native allocations and complete or transfer job dependencies before their data lifetime ends; every async/load handle has one release owner.
- Use allocation-free physics queries where measured hot paths require them; make layers, fixed timestep, and query scope explicit.
- Treat navigation status and avoidance as state; reset stale destinations when movement is cancelled, blocked, or target becomes invalid.
- Route audio through mixers and keep listener ownership singular and scene-transition-safe.
- Use Burst/ECS only for measured data-parallel work; structural changes use command buffers with clear playback ownership.
- Keep shader, VFX, and UI implementation aligned with active render pipeline and supported platforms.
- Validate serialized data, prefab references, input actions, and build settings through Unity-native tooling.
