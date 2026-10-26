# Task 001 — Reservation capacity and idempotency

Given a map of resource capacities and a sequence of reservation commands, implement a pure state transition function.

## Acceptance rules

1. Reject empty IDs, non-integer or non-positive seat counts, unknown resources, and insufficient capacity.
2. Accept a valid request only when enough capacity remains; exact capacity is allowed.
3. The same request ID, once accepted, is idempotent: replay returns `duplicate` and never reserves more seats. The original accepted outcome has a stable reservation ID.
4. Rejected requests do not change state. An invalid request ID can be retried with a corrected command.
5. Do not mutate the input state; output data must match the required observable state, independent of internal algorithm.
6. One request ID represents a single operation across all resources.

## Verification model

- Golden reference: `src/domain.ts:golden`.
- Independent alternative: `src/domain.ts:alternative`.
- Negative controls: `mutantOverbook`, `mutantDuplicate`.
- Fixed boundary tests + seeded generated command sequences.
- A candidate passes only when **all** observed outcomes and final states match the contract.

## Next steps for a harder challenge

- Add concurrency and transactional persistence with PostgreSQL.
- Cover optimistic concurrency and serialization-failure retries.
- Add metamorphic properties that do not encode the golden algorithm.
- Shrink failing command sequences to the shortest counterexample.
