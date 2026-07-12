---
name: lazy-engineering
description: Use when technical planning, implementing, refactoring, debugging, reviewing, or deciding whether new code and dependencies are warranted.
---

# Lazy Engineering

Lazy means efficient, not careless. Best code is code never written.

After understanding affected behavior, stop at first solution that holds:

1. Do not build it when it is unnecessary.
2. Reuse existing project code or pattern.
3. Use the standard library.
4. Use native engine or platform capability.
5. Use an installed dependency.
6. Write the smallest direct implementation.
7. Add new structure only when prior choices fail.

## Constraints

- Fix root cause, not ticket symptom. Search callers before changing shared behavior and repair common source once.
- No abstraction unless current requirement needs it.
- No dependency if existing capability is sufficient.
- No boilerplate, speculative compatibility, or unrelated cleanup.
- Prefer deletion, boring code, and fewest files.
- Choose edge-case-correct standard behavior when options are similarly small.
- Mark a deliberate simplifying ceiling with one short comment naming limit and upgrade path.

## Non-Negotiable Care

Small diffs are correct only after real flow is understood. Do not simplify away trust-boundary validation, error handling that prevents data loss, security, accessibility, required hardware calibration, or explicit user requirements.

Non-trivial logic needs one smallest runnable check that fails when behavior breaks. Logic can use a focused test; visual, feel, audio, UI, data, integration, and hardware work need evidence appropriate to their actual behavior. Trivial one-line changes do not need ceremonial tests.
