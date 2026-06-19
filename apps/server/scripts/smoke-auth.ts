/**
 * Full auth flow smoke test against an in-memory MongoDB:
 * register → login → /me, plus the security guarantee that passwordHash never leaks.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

async function main() {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = 'test_secret_test_secret_0123456789';
  process.env.NODE_ENV = 'test';

  // Import AFTER env is set so config/env validates against our test values.
  const { createApp } = await import('../src/app');
  await mongoose.connect(process.env.MONGODB_URI);

  const server = createApp().listen(4556);
  const base = 'http://127.0.0.1:4556/api';
  let failures = 0;
  const check = (name: string, cond: boolean, extra?: unknown) => {
    // eslint-disable-next-line no-console
    console.log(`${cond ? '✅' : '❌'} ${name}`);
    if (!cond) {
      failures++;
      if (extra !== undefined) console.log('   →', JSON.stringify(extra));
    }
  };

  const creds = { name: 'Sara', email: 'sara@example.com', password: 'supersecret' };

  // register
  const reg = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  });
  const regBody = await reg.json();
  check('register → 201', reg.status === 201, regBody);
  check('register returns token', typeof regBody.data?.token === 'string');
  check('register hides passwordHash', regBody.data?.user?.passwordHash === undefined, regBody.data?.user);

  // duplicate email → 409
  const dup = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  });
  check('duplicate register → 409', dup.status === 409);

  // login
  const login = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: creds.email, password: creds.password }),
  });
  const loginBody = await login.json();
  check('login → 200', login.status === 200, loginBody);
  const token: string = loginBody.data?.token;

  // wrong password → 401
  const bad = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: creds.email, password: 'wrongpass' }),
  });
  check('wrong password → 401', bad.status === 401);

  // /me with token
  const me = await fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  const meBody = await me.json();
  check('GET /me with token → 200', me.status === 200, meBody);
  check('/me email matches', meBody.data?.user?.email === creds.email);

  // update profile
  const upd = await fetch(`${base}/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Sara K.' }),
  });
  const updBody = await upd.json();
  check('PATCH /users/me → 200', upd.status === 200, updBody);
  check('profile name updated', updBody.data?.user?.name === 'Sara K.');

  server.close();
  await mongoose.disconnect();
  await mongo.stop();

  // eslint-disable-next-line no-console
  console.log(failures === 0 ? '\nALL AUTH SMOKE CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
