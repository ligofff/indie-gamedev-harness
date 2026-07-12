---
name: engine-unreal
description: Use when working in an Unreal Engine project with C++, Blueprints, GAS, replication, UMG, CommonUI, rendering, or Unreal profiling.
---

# Unreal Engine

Verify Unreal Engine version, enabled plugins, target platforms, and project coding conventions before selecting APIs.

- Reference lookup order: exact VERSION, then breaking/deprecated changes, then relevant module or plugin documentation.
- Track resource lifetime across acquisition, async work, scene or world teardown, cancellation, ownership transfer, release, and error paths. Before owner teardown, cancel pending work and unsubscribe callbacks, events, signals, delegates, and listeners; callbacks must not access a dead owner. Do not retain invalid engine objects, handles, or native resources.

- Keep C++ and Blueprint responsibilities intentional. Put stable, performance-sensitive, reusable foundations in C++; retain iteration-friendly authored behavior in Blueprint where it remains clear and testable.
- Respect UObject lifetime, garbage collection, actor/component ownership, delegates, reflection, and async lifetime boundaries.
- Use UPROPERTY and TObjectPtr where reflected UObject ownership or GC visibility requires it; make construction, BeginPlay, teardown, and async callback lifetime explicit.
- Create UObjects through Unreal factories or engine creation APIs, never raw allocation. Keep reflected references visible to GC through appropriate reflected properties.
- Use soft asset references for assets not required immediately or always resident; resolve asynchronously, handle failure, and retain hard references only when lifetime and memory budget require them.
- Avoid default Tick work; prefer events, timers, and cached query results, then profile remaining per-frame work.
- Treat replication as design and security work: authority, ownership, relevancy, prediction, validation, serialization, and bandwidth must be explicit.
- Validate server RPC inputs and sender ownership; choose reliability deliberately, rate-limit high-frequency traffic, and scope relevancy to player need.
- Use Gameplay Ability System when its tags, effects, prediction, and lifecycle solve current gameplay complexity; do not introduce it for a trivial mechanic.
- Keep nav bounds current for streamed or changed spaces; handle unreachable paths explicitly. Set audio concurrency limits, PCG generation budgets, and cancellation/cleanup paths.
- For GAS, define ability grant/removal lifecycle, tag ownership, effect ownership, and authority/prediction boundary. For UI, use project stack/navigation conventions and virtualize large repeated lists.
- Keep UMG and CommonUI presentation separate from authoritative game state. Test controller focus, scaling, and localization.
- Profile packaged builds and target hardware before changing rendering, tick behavior, or memory strategy.
