# Design decisions and trade-offs

## Why a pure-state solver?

A pure transition avoids network, clock and database nondeterminism and makes reproducibility easy to audit. Production reservations would need a transaction or atomic conditional update under concurrent load.

## Why behavioral rather than source comparison?

A verifier should accept semantically correct solutions that differ in style, control flow, or data structure. `alternative` uses a different counting approach, yet passes the same checks.

## Why negative controls?

A verifier that accepts every submission provides no evaluation signal. Two plausible bad implementations intentionally bypass important requirements; tests assert they are rejected.

## Why not claim a full RL environment?

This is the central evaluation kernel only. A real environment also needs an isolated working tree, task provisioning, patch application, restricted execution, per-task score definitions, instrumentation, and robust attack resistance.

## Known blind spots

- Seeded generator is lightweight, not exhaustive.
- No shrinking/minimization of counterexamples yet.
- No property-based library integration.
- No cross-process isolation or secure untrusted-code execution.
- No database, concurrency simulation, or load testing.
- Object equality uses a normalized representation, so ordering conventions are part of this task's contract.

## Suggested roadmap

1. Add candidate submission interface with container isolation and resource limits.
2. Add sequence minimization for failing cases.
3. Add benchmark tasks and deterministic performance budgets with noise controls.
4. Add optional PostgreSQL persistence task with transactional correctness tests.
5. Expose task metadata as JSON and publish a contributor guide.
