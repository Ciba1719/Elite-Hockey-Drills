// node --test _tests/program-email.test.mjs  — /api/program-email against a fake MailerLite.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeHandler, PER_IP_PER_HOUR, clean } from '../netlify/functions/program-email.mjs';

const GROUPS = ['en', 'cs', 'de', 'sv', 'fi', 'es', 'ru'].map((l, i) => ({ id: String(100 + i), name: `app-program-email-${l}` }));
const LINES = {
  hi: 'Hi Jakub,',
  week: '4 sessions a week (Monday, Tuesday, Thursday, Friday), about 47 minutes each.',
  first: 'Strength — Legs: Med Ball Rotational Throw 2 × 8 each side, DB RDL 3 × 7-8 reps',
  offer: 'Yearly plan: the first 7 days are free, then 99,90 € a year. Monthly: 19,99 € a month, no free week. Cancel anytime in App Store.',
};

function fakeMailerLite(subscribers = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url);
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ method: init.method || 'GET', path: u.pathname.replace('/api', '') + u.search, body, auth: init.headers?.Authorization });
    const ok = (data) => ({ ok: true, status: 200, json: async () => ({ data }), text: async () => '' });
    if (u.pathname === '/api/groups') return ok(GROUPS);
    if (u.pathname.startsWith('/api/subscribers/') && (init.method || 'GET') === 'GET') {
      const s = subscribers[decodeURIComponent(u.pathname.split('/').pop())];
      return s ? ok(s) : { ok: false, status: 404, json: async () => ({}), text: async () => '' };
    }
    if (u.pathname === '/api/subscribers' && init.method === 'POST') return ok({ id: 'sub1', ...body });
    return { ok: false, status: 500, json: async () => ({}), text: async () => 'unexpected' };
  };
  return { fetchImpl, calls };
}
const memStore = () => { const m = new Map(); return () => ({ get: async (k) => m.get(k) ?? null, set: async (k, v) => { m.set(k, v); } }); };
const post = (body, ip = '1.2.3.4') => [new Request('https://elitehockeydrills.com/api/program-email', { method: 'POST', body: JSON.stringify(body) }), { ip }];
const ENV = { MAILERLITE_API_TOKEN: 'test-token' };

test('a new address joins its language group with the four lines, status active', async () => {
  const ml = fakeMailerLite();
  const h = makeHandler({ fetchImpl: ml.fetchImpl, store: memStore(), env: ENV });
  const res = await h(...post({ email: ' Jakub@Example.com ', lang: 'cs', age: 24, name: 'Jakub', ...LINES }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, emailed: true });
  const upsert = ml.calls.find((c) => c.method === 'POST');
  assert.equal(upsert.auth, 'Bearer test-token');
  assert.equal(upsert.body.email, 'jakub@example.com');
  assert.deepEqual(upsert.body.groups, ['101']); // app-program-email-cs
  assert.equal(upsert.body.status, 'active');
  assert.deepEqual(upsert.body.fields, {
    sp_hi: LINES.hi, sp_week: LINES.week, sp_first: LINES.first, sp_offer: LINES.offer,
    app_language: 'cs', lead_source: 'app_program_email', name: 'Jakub',
  });
});

test('someone who unsubscribed is never re-activated or emailed', async () => {
  const ml = fakeMailerLite({ 'old@example.com': { id: 's9', status: 'unsubscribed', groups: [] } });
  const h = makeHandler({ fetchImpl: ml.fetchImpl, store: memStore(), env: ENV });
  const res = await h(...post({ email: 'old@example.com', lang: 'en', age: 30, ...LINES }));
  assert.deepEqual(await res.json(), { ok: true, emailed: false });
  assert.equal(ml.calls.filter((c) => c.method === 'POST').length, 0);
});

test('an existing active subscriber keeps their status; already in the group means no second email', async () => {
  const ml = fakeMailerLite({ 'pdf@example.com': { id: 's2', status: 'active', groups: [{ id: '100' }] } });
  const h = makeHandler({ fetchImpl: ml.fetchImpl, store: memStore(), env: ENV });
  const res = await h(...post({ email: 'pdf@example.com', lang: 'en', age: 41, ...LINES }));
  assert.deepEqual(await res.json(), { ok: true, emailed: false });
  const upsert = ml.calls.find((c) => c.method === 'POST');
  assert.equal(upsert.body.status, undefined);
});

test('under 16, a bad address, missing lines or markup in a line', async () => {
  const ml = fakeMailerLite();
  const h = makeHandler({ fetchImpl: ml.fetchImpl, store: memStore(), env: ENV });
  assert.equal((await h(...post({ email: 'a@b.co', lang: 'en', age: 15, ...LINES }))).status, 400);
  assert.equal((await h(...post({ email: 'not-an-email', lang: 'en', age: 20, ...LINES }))).status, 400);
  assert.equal((await h(...post({ email: 'a@b.co', lang: 'en', age: 20, ...LINES, offer: '' }))).status, 400);
  assert.equal(ml.calls.length, 0);
  assert.equal(clean('<a href="x">win</a>\u0007'), 'a href="x" win /a');
  assert.equal(clean('x'.repeat(400)).length, 250);
});

test('an unknown language falls back to English', async () => {
  const ml = fakeMailerLite();
  const h = makeHandler({ fetchImpl: ml.fetchImpl, store: memStore(), env: ENV });
  await h(...post({ email: 'a@b.co', lang: 'pl', age: 20, ...LINES }));
  assert.deepEqual(ml.calls.find((c) => c.method === 'POST').body.groups, ['100']);
});

test(`more than ${PER_IP_PER_HOUR} requests an hour from one connection are refused`, async () => {
  const ml = fakeMailerLite();
  const h = makeHandler({ fetchImpl: ml.fetchImpl, store: memStore(), env: ENV, now: () => 1_800_000_000_000 });
  for (let i = 0; i < PER_IP_PER_HOUR; i++) assert.equal((await h(...post({ email: `p${i}@b.co`, lang: 'en', age: 20, ...LINES }))).status, 200);
  assert.equal((await h(...post({ email: 'p9@b.co', lang: 'en', age: 20, ...LINES }))).status, 429);
  assert.equal((await h(...post({ email: 'p9@b.co', lang: 'en', age: 20, ...LINES }, '5.6.7.8'))).status, 200);
});

test('no token or no group: a clear server error, nothing sent', async () => {
  const ml = fakeMailerLite();
  assert.equal((await makeHandler({ fetchImpl: ml.fetchImpl, store: memStore(), env: {} })(...post({ email: 'a@b.co', lang: 'en', age: 20, ...LINES }))).status, 500);
  const empty = async (url) => (new URL(url).pathname === '/api/groups'
    ? { ok: true, status: 200, json: async () => ({ data: [] }) } : { ok: false, status: 500, json: async () => ({}) });
  const res = await makeHandler({ fetchImpl: empty, store: memStore(), env: ENV })(...post({ email: 'a@b.co', lang: 'en', age: 20, ...LINES }));
  assert.equal(res.status, 500);
  assert.deepEqual(await res.json(), { error: 'group_not_found' });
});
