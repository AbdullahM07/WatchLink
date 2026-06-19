/**
 * No-DB smoke test: boots the Express app (no Mongo connection) and verifies
 * routing, validation, the response envelope and the 404/error handlers.
 */
import { createApp } from '../src/app';

async function main() {
  const app = createApp();
  const server = app.listen(4555);
  const base = 'http://127.0.0.1:4555';
  let failures = 0;

  const check = (name: string, cond: boolean, extra?: unknown) => {
    // eslint-disable-next-line no-console
    console.log(`${cond ? '✅' : '❌'} ${name}`);
    if (!cond) {
      failures++;
      if (extra !== undefined) console.log('   →', extra);
    }
  };

  // health
  const health = await fetch(`${base}/api/health`).then((r) => r.json());
  check('GET /api/health → success envelope', health.success === true, health);

  // validation error (missing/short fields) — runs before any DB access
  const bad = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'x', email: 'nope', password: '123' }),
  });
  const badBody = await bad.json();
  check('POST /api/auth/register (invalid) → 400', bad.status === 400, bad.status);
  check('  → error envelope success=false', badBody.success === false, badBody);

  // unknown route → 404
  const nf = await fetch(`${base}/api/does-not-exist`);
  check('GET unknown route → 404', nf.status === 404, nf.status);

  // /auth/me without token → 401
  const noAuth = await fetch(`${base}/api/auth/me`);
  check('GET /api/auth/me (no token) → 401', noAuth.status === 401, noAuth.status);

  server.close();
  // eslint-disable-next-line no-console
  console.log(failures === 0 ? '\nALL APP SMOKE CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
