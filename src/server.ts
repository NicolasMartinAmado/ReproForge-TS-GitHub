import { createServer } from 'node:http';
import { alternative, golden, mutantDuplicate, mutantOverbook } from './domain.ts';
import { verify } from './verifier.ts';
const solvers = { golden, alternative, mutantOverbook, mutantDuplicate };
const server = createServer((req,res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'GET') { res.writeHead(405); res.end(JSON.stringify({error:'method_not_allowed'})); return; }
  if (url.pathname === '/health') { res.writeHead(200); res.end(JSON.stringify({status:'ok'})); return; }
  if (url.pathname === '/api/verify') {
    const variant = url.searchParams.get('solver') ?? 'golden';
    if (!Object.hasOwn(solvers,variant)) { res.writeHead(400); res.end(JSON.stringify({error:'unknown_solver', choices:Object.keys(solvers)})); return; }
    const rawSeed = url.searchParams.get('seed') ?? '20261026';
    const seed = Number(rawSeed);
    if (!/^\d+$/.test(rawSeed) || !Number.isSafeInteger(seed) || seed > 4294967295) {res.writeHead(400);res.end(JSON.stringify({error:'invalid_seed'}));return;}
    const report = verify(solvers[variant as keyof typeof solvers], seed);
    res.writeHead(200); res.end(JSON.stringify({solver:variant, seed, ...report})); return;
  }
  if (url.pathname === '/') { res.writeHead(200); res.end(JSON.stringify({project:'ReproForge',endpoints:['/health','/api/verify?solver=golden','/api/verify?solver=mutantOverbook']}));return; }
  res.writeHead(404);res.end(JSON.stringify({error:'not_found'}));
});
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid PORT');
server.listen(port, '0.0.0.0', () => console.log(`ReproForge listening at http://localhost:${port}`));
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
