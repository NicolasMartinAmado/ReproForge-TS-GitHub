import { golden, initialState } from './domain.ts';
import type { Command, Solver, State } from './domain.ts';

export type Case = Readonly<{ name: string; capacity: Record<string, number>; commands: readonly Command[] }>;
export type Report = Readonly<{ passed: boolean; cases: number; failures: readonly string[] }>;

const cmd = (requestId: string, resourceId: string, seats: number): Command => ({ requestId, resourceId, seats });
export const fixtures: readonly Case[] = [
  { name: 'simple reservation', capacity: { hall: 5 }, commands: [cmd('a', 'hall', 2)] },
  { name: 'exact boundary', capacity: { hall: 5 }, commands: [cmd('a','hall',3),cmd('b','hall',2),cmd('c','hall',1)] },
  { name: 'idempotent replay', capacity: { hall: 4 }, commands: [cmd('a','hall',3),cmd('a','hall',3),cmd('b','hall',1)] },
  { name: 'isolated resources', capacity: {a: 2, b: 3}, commands: [cmd('a','a',2),cmd('b','b',3),cmd('c','a',1)] },
  { name: 'invalid and missing', capacity: { hall: 3 }, commands: [cmd('a','hall',0),cmd('b','other',1),cmd('c','hall',-1),cmd('d','hall',2)] },
  { name: 'zero capacity', capacity: { hall: 0 }, commands: [cmd('a','hall',1)] }
];

function canonical(state: State): string {
  return JSON.stringify({
    capacity: Object.entries(state.capacity).sort(([a],[b]) => a.localeCompare(b)),
    reservations: state.reservations.map(r => [r.id,r.resourceId,r.seats]).sort((a,b) => String(a[0]).localeCompare(String(b[0]))),
    processed: Object.entries(state.processed).sort(([a],[b]) => a.localeCompare(b))
  });
}

// LCG: deterministic, stable seed, no time/network/random dependency.
function* generatedCases(seed: number, count: number): Generator<Case> {
  let x = seed >>> 0;
  const next = (): number => { x = (Math.imul(1664525,x) + 1013904223) >>> 0; return x; };
  for (let i=0;i<count;i++) {
    const capacity = { a: next()%8, b: next()%8 };
    const commands: Command[] = [];
    for (let j=0;j<12;j++) commands.push(cmd(`req-${next()%9}`, next()%2===0 ? 'a':'b', (next()%10)-1));
    yield {name:`generated seed=${seed} case=${i}`,capacity,commands};
  }
}

export function verify(solver: Solver, seed = 20261026, generatedCount = 100): Report {
  const failures: string[] = [];
  const cases = [...fixtures, ...generatedCases(seed, generatedCount)];
  for (const scenario of cases) {
    let expected = initialState(scenario.capacity);
    let actual = initialState(scenario.capacity);
    for (let i=0;i<scenario.commands.length;i++) {
      const command = scenario.commands[i];
      const inputSnapshot = canonical(actual);
      const e = golden(expected, command);
      let a;
      try { a = solver(actual, command); }
      catch (error) { failures.push(`${scenario.name}, step ${i}: threw ${String(error)}`); break; }
      if (canonical(actual) !== inputSnapshot) { failures.push(`${scenario.name}, step ${i}: mutated input state`); break; }
      if (JSON.stringify(a.outcome) !== JSON.stringify(e.outcome) || canonical(a.state) !== canonical(e.state)) {
        failures.push(`${scenario.name}, step ${i}: expected ${JSON.stringify(e.outcome)}, got ${JSON.stringify(a.outcome)}`);
        break;
      }
      expected = e.state;
      actual = a.state;
    }
  }
  return { passed: failures.length === 0, cases: cases.length, failures };
}
