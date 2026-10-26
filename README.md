# ReproForge TS

A small, auditable **TypeScript coding-evaluation laboratory** for generating reproducible software-engineering exercises and checking candidate fixes against behavioral specifications. Designed as a portfolio sample illustrating golden reference implementations, equivalence testing, deterministic test generation, and negative controls.

> **Disclosure:** This repository is an AI-assisted portfolio project and demonstration, not evidence of prior merged contributions to third-party open-source projects. Review, understand and improve it before presenting it as your work. It is not a production-ready reinforcement learning platform.

## What it demonstrates

- **Golden reference** for a reservation-capacity workflow with input validation, exactly-once *effects* through idempotency keys, and invariant-preserving state transitions.
- **Alternative valid solution**, architecturally different but behaviorally equivalent.
- **Two intentionally incorrect mutants** to demonstrate that the verifier rejects overbooking and duplicate processing.
- **Deterministic seeded scenario generator** alongside hand-crafted edge cases. Same seed + version -> same inputs.
- **Behavioral verification**: validates outcomes and resulting state without comparing source text.
- **Tiny HTTP service** exposing reproducible verification reports.
- **Automated Node test suite** and GitHub Actions CI.

## Quick start

Requires Node.js 22.16+ (Node.js 24 LTS recommended). No runtime dependencies.

```bash
npm test
npm run verify
npm start
# visit http://localhost:3000/api/verify?solver=alternative
# visit http://localhost:3000/api/verify?solver=mutantOverbook
```

Expected CLI results: `golden` and `alternative` PASS; both `mutant*` FAIL (expected negative controls). `npm run verify` exits successfully because rejecting known bad solutions is the intended outcome.

## Architecture

```text
src/domain.ts          Domain contracts + golden, alternative, and mutants
src/verifier.ts        Fixed fixtures + seeded test generation + checker
src/cli.ts             Positive/negative control runner
src/server.ts          HTTP endpoint for demonstration
 tests/verifier.test.ts Executable checks for the verifier itself
 docs/task-spec.md     Task specification and acceptance criteria
 docs/design.md        Decisions, limitations, extension plan
```

## API

| Route | Description |
|---|---|
| `GET /health` | Health probe |
| `GET /api/verify?solver=golden&seed=123` | Run reference solution |
| `GET /api/verify?solver=alternative` | Verify a different correct approach |
| `GET /api/verify?solver=mutantOverbook` | See a detected capacity bug |
| `GET /api/verify?solver=mutantDuplicate` | See a detected idempotency bug |

## Limitations

This is an **in-process educational verifier**, not a sandbox for untrusted external submissions. Running arbitrary third-party code requires isolation, CPU/time/memory quotas, file-system restrictions, and network controls. It currently tests sequential state transitions, not true concurrency or database races; real concurrent reservation systems require atomic database operations. The generator is deterministic, not cryptographically random or comprehensive. CI checks are not a substitute for threat modeling.

See [design notes](docs/design.md) and [task specification](docs/task-spec.md).
