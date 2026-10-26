export type Reservation = Readonly<{ id: string; resourceId: string; seats: number }>;
export type Command = Readonly<{ requestId: string; resourceId: string; seats: number }>;
export type State = Readonly<{ capacity: Readonly<Record<string, number>>; reservations: readonly Reservation[]; processed: Readonly<Record<string, string>> }>;
export type Result = Readonly<{ state: State; outcome: Readonly<{ status: 'accepted' | 'rejected' | 'duplicate'; reason?: string; reservationId?: string }> }>;
export type Solver = (state: State, command: Command) => Result;

export function initialState(capacity: Record<string, number>): State {
  for (const [id, count] of Object.entries(capacity)) {
    if (!id || !Number.isSafeInteger(count) || count < 0) throw new Error('Invalid capacity');
  }
  return { capacity: { ...capacity }, reservations: [], processed: {} };
}

/** Canonical specification: first accepted request reserves seats, duplicates are idempotent. */
export const golden: Solver = (state, command) => {
  const known = Object.prototype.hasOwnProperty.call(state.processed, command.requestId);
  if (known) return { state, outcome: { status: 'duplicate', reservationId: state.processed[command.requestId] } };
  if (!command.requestId || !command.resourceId || !Number.isSafeInteger(command.seats) || command.seats <= 0) {
    return { state, outcome: { status: 'rejected', reason: 'invalid_command' } };
  }
  const limit = state.capacity[command.resourceId];
  if (limit === undefined) return { state, outcome: { status: 'rejected', reason: 'unknown_resource' } };
  const reserved = state.reservations.filter(r => r.resourceId === command.resourceId).reduce((n, r) => n + r.seats, 0);
  if (command.seats > limit - reserved) return { state, outcome: { status: 'rejected', reason: 'insufficient_capacity' } };
  const reservationId = `reservation:${command.requestId}`;
  return {
    state: {
      capacity: state.capacity,
      reservations: [...state.reservations, { id: reservationId, resourceId: command.resourceId, seats: command.seats }],
      processed: { ...state.processed, [command.requestId]: reservationId }
    },
    outcome: { status: 'accepted', reservationId }
  };
};

/** Alternative correct implementation with a different internal data-flow. */
export const alternative: Solver = (state, command) => {
  const original = state.processed[command.requestId];
  if (Object.hasOwn(state.processed, command.requestId)) {
    return { state, outcome: { status: 'duplicate', reservationId: original } };
  }
  if (!command.requestId || !command.resourceId || !Number.isSafeInteger(command.seats) || command.seats < 1) {
    return { state, outcome: { status: 'rejected', reason: 'invalid_command' } };
  }
  if (!Object.hasOwn(state.capacity, command.resourceId)) return { state, outcome: { status: 'rejected', reason: 'unknown_resource' } };
  let remaining = state.capacity[command.resourceId];
  for (const entry of state.reservations) if (entry.resourceId === command.resourceId) remaining -= entry.seats;
  if (remaining < command.seats) return { state, outcome: { status: 'rejected', reason: 'insufficient_capacity' } };
  const reservationId = 'reservation:' + command.requestId;
  return { state: { capacity: { ...state.capacity }, reservations: state.reservations.concat({id: reservationId, resourceId: command.resourceId, seats: command.seats}), processed: {...state.processed, [command.requestId]: reservationId} }, outcome: { status: 'accepted', reservationId } };
};

/** Incorrect implementation: no capacity check (for verifier negative controls). */
export const mutantOverbook: Solver = (state, command) => {
  if (!command.requestId || !command.resourceId || !Number.isSafeInteger(command.seats) || command.seats <= 0) return {state, outcome: {status:'rejected',reason:'invalid_command'}};
  if (Object.hasOwn(state.processed, command.requestId)) return {state, outcome:{status:'duplicate',reservationId:state.processed[command.requestId]}};
  if (!Object.hasOwn(state.capacity, command.resourceId)) return {state, outcome:{status:'rejected',reason:'unknown_resource'}};
  const reservationId = `reservation:${command.requestId}`;
  return { state: {...state, reservations: [...state.reservations, {id:reservationId, resourceId:command.resourceId, seats:command.seats}], processed: {...state.processed, [command.requestId]:reservationId}}, outcome:{status:'accepted',reservationId} };
};

/** Incorrect implementation: treats replay as a new reservation. */
export const mutantDuplicate: Solver = (state, command) => {
  // Preserve the original processed history but deliberately bypass replay protection.
  const withoutProcessed = {...state, processed: {}};
  return golden(withoutProcessed, command);
};
