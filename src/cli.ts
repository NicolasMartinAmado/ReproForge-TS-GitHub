import { alternative, golden, mutantDuplicate, mutantOverbook } from './domain.ts';
import { verify } from './verifier.ts';
for (const [name, fn] of Object.entries({golden, alternative, mutantOverbook, mutantDuplicate})) {
  const report=verify(fn);
  console.log(`${name.padEnd(18)} ${report.passed?'PASS':'FAIL'} (${report.cases} scenarios)${report.failures.length?' | '+report.failures[0]:''}`);
}
