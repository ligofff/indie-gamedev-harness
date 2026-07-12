---
name: architecture-engineering
description: Use when making or reviewing technical architecture, APIs, ownership, lifecycle, dependencies, refactors, data boundaries, or cross-cutting implementation decisions.
---

# Architecture And Engineering

Architecture exists to make current behavior correct and changeable. Start from actual flow, constraints, and existing project patterns. Do not create architecture as ceremony.

## Boundaries

- Keep dependencies directed. High-level gameplay policy should not depend directly on low-level engine details when a narrow boundary is sufficient.
- Define ownership, lifetime, initialization, cleanup, failure, and thread expectations for resources and services.
- Prefer small APIs that expose required behavior over broad manager objects or global mutable state.
- Make state transitions explicit. Hidden temporal coupling causes hard-to-reproduce game bugs.
- Keep gameplay values in project-native data and keep data valid, versioned where needed, defaulted, and free of orphan references.

## Decisions

- Reuse established patterns unless they block correctness or maintainability.
- Evaluate engine-native capability, dependency cost, platform support, debugging, migration, and testability before adding technology.
- Record a durable architectural decision only when code, configuration, and existing notes cannot explain a cross-cutting choice. Reuse project convention or ask where to record it.
- Refactor in safe increments with a behavior-preserving check between steps.
- Prefer reversible steps: isolate risky changes, preserve a rollback path, and verify behavior before irreversible data, API, or content migrations.
- State contracts at boundaries: accepted inputs, ownership, outputs, failure behavior, and compatibility expectations.
- For each cross-system interface, document data flow, authority, ordering, and transition rules; reject invalid transitions at boundary.
- Identify highest technical risks early; reduce each with the smallest targeted spike, measurement, or check before committing dependent work.
- State risk and budget inputs that constrain decision: target platforms, frame/memory/loading/network limits, content scale, team capacity, and migration cost.

## Performance And Failure

- Measure hot paths, loading, allocation, rendering, and memory before optimizing.
- Define graceful behavior for missing assets, corrupt data, unavailable services, and platform limits where player data or progress is at risk.
- Avoid global singletons when dependency injection or explicit ownership makes behavior testable without excessive ceremony.
