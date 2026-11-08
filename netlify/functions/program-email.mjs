// POST /api/program-email -> "Email me my program" from the app (funnel move 5, 2026-11-07).
//
// A 16+ player who saw their program and its price but is not ready to start taps
// "Email me my program" and gets ONE email: their week, their first session and how
// to start. The app writes those lines (it has the program, the translations and the
// store's prices); this function puts them on the MailerLite subscriber and adds them
// to "app-program-email-<lang>", whose "joins group" automation sends the email once.
// Same server-side token as /api/subscribe (MAILERLITE_API_TOKEN); the app never
// holds it. Details: HockeyAPP/docs/PROGRAM_EMAIL.md.
import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

export const config = { path: '/api/program-email' };

const MAILERLITE_API = 'https://connect.mailerlite.com/api';
export const LANGS = ['en', 'cs', 'de', 'sv', 'fi', 'es', 'ru'];
export const GROUP_PREFIX = 'app-program-email';
export const MIN_AGE = 16;
// Abuse guard for a public endpoint: a handful of requests per connection per hour.
// MailerLite itself sends the email once per address (the automation runs once per
// subscriber), so repeating one address cannot flood anyone.
export const PER_IP_PER_HOUR = 5;
const FIELD_MAX = 250;

const isEmail = (s) => typeof s === 'string' && s.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s);
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 32);
// Field values land inside the email's HTML: no markup, no control characters.
export const clean = (s) => {
  const str = String(s ?? '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim();
  return str.length > FIELD_MAX ? `${str.slice(0, FIELD_MAX - 1).trimEnd()}…` : str;
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export function makeHandler({
  fetchImpl = (...a) => fetch(...a),
  store = () => getStore({ name: 'program-email', consistency: 'strong' }),
  env = process.env,
  now = () => Date.now(),
} = {}) {
  const ml = (path, init = {}) => fetchImpl(`${MAILERLITE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.MAILERLITE_API_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers || {}),
    },
  });

  return async (req, context) => {
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
    if (!env.MAILERLITE_API_TOKEN) {
      console.error('[program-email] MAILERLITE_API_TOKEN is not set');
      return json({ error: 'not_configured' }, 500);
    }

    let body;
    try { body = await req.json(); } catch { return json({ error: 'bad_request' }, 400); }

    const email = String(body?.email || '').trim().toLowerCase();
    if (!isEmail(email)) return json({ error: 'invalid_email' }, 400);
    // The app only offers this at 16+; the function holds the same line.
    if (!(Number(body.age) >= MIN_AGE)) return json({ error: 'not_offered' }, 400);
    const lang = LANGS.includes(body.lang) ? body.lang : 'en';
    const lines = { hi: clean(body.hi), week: clean(body.week), first: clean(body.first), offer: clean(body.offer) };
    if (Object.values(lines).some((v) => !v)) return json({ error: 'bad_request' }, 400);

    // Rate limit per connection (hashed, kept one hour).
    const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown';
    const hourKey = `ip-${sha(ip)}-${Math.floor(now() / 3600000)}`;
    try {
      const s = store();
      const count = Number(await s.get(hourKey)) || 0;
      if (count >= PER_IP_PER_HOUR) return json({ error: 'rate_limited' }, 429);
      await s.set(hourKey, String(count + 1));
    } catch (e) {
      console.error(`[program-email] rate-limit store: ${e?.message || e}`); // never block a real request on it
    }

    try {
      const gRes = await ml(`/groups?filter[name]=${encodeURIComponent(GROUP_PREFIX)}&limit=50`);
      if (!gRes.ok) throw new Error(`groups lookup failed (${gRes.status})`);
      const group = ((await gRes.json()).data || []).find((g) => g.name === `${GROUP_PREFIX}-${lang}`);
      if (!group) {
        console.error(`[program-email] MailerLite group "${GROUP_PREFIX}-${lang}" not found`);
        return json({ error: 'group_not_found' }, 500);
      }

      // Someone who unsubscribed (or bounced) stays that way: never re-activate them.
      const before = await ml(`/subscribers/${encodeURIComponent(email)}`);
      const existing = before.ok ? (await before.json()).data : null;
      if (existing && existing.status && existing.status !== 'active') {
        console.log(`[program-email] ${existing.status} subscriber, not emailed`);
        return json({ ok: true, emailed: false });
      }
      const alreadyIn = !!(existing && (existing.groups || []).some((g) => String(g.id) === String(group.id)));

      const fields = {
        sp_hi: lines.hi, sp_week: lines.week, sp_first: lines.first, sp_offer: lines.offer,
        app_language: lang, // the account's field is app_language (there is no "language" field)
        lead_source: 'app_program_email', // "source" is reserved in MailerLite
      };
      const name = clean(body.name);
      if (name) fields.name = name;

      const sRes = await ml('/subscribers', {
        method: 'POST',
        body: JSON.stringify({ email, fields, groups: [group.id], ...(existing ? {} : { status: 'active' }) }),
      });
      if (!sRes.ok) {
        console.error(`[program-email] MailerLite upsert failed (${sRes.status}): ${await sRes.text().catch(() => '')}`);
        return json({ error: 'subscribe_failed' }, 502);
      }
      // Already in the group: the automation sent their program before and runs once.
      return json({ ok: true, emailed: !alreadyIn });
    } catch (e) {
      console.error(`[program-email] error: ${e?.message || e}`);
      return json({ error: 'subscribe_failed' }, 502);
    }
  };
}

export default makeHandler();
