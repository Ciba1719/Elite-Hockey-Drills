// POST /api/subscribe -> add a /survey lead to the correct MailerLite age group.
//
// survey.html is a public lead-magnet page, so the MailerLite API token must never
// live in its client JS — anyone could read it from "view source" and export, spam,
// or delete the whole subscriber list. This function keeps the full-access token
// server-side in a Netlify env var (MAILERLITE_API_TOKEN) and is the only code that
// talks to connect.mailerlite.com. Same env-var + function pattern the Stripe gate
// uses (see buy.mjs / lib/paywall.mjs). The browser only POSTs the survey answers.

export const config = { path: '/api/subscribe' };

const MAILERLITE_API = 'https://connect.mailerlite.com/api';

// Survey age bucket -> MailerLite group name. Names must match the groups in the
// MailerLite account exactly. Unknown/missing age falls back to the adult group.
const GROUP_NAMES = {
  '9_13':   'youth-program',
  '14_18':  'teen-program',
  '19_39':  'adult-program',
  '40plus': 'masters-program',
};
function pickGroupName(age) {
  return GROUP_NAMES[age] || GROUP_NAMES['19_39'];
}

const isEmail = (s) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

// Authenticated call to the MailerLite API. Reads the token at call time so it is
// only ever held server-side and the env var can rotate without a code change.
function ml(path, init = {}) {
  return fetch(`${MAILERLITE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.MAILERLITE_API_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers || {}),
    },
  });
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  if (!process.env.MAILERLITE_API_TOKEN) {
    console.error('[subscribe] MAILERLITE_API_TOKEN is not set');
    return json({ error: 'not_configured' }, 500);
  }

  let body;
  try { body = await req.json(); } catch { return json({ error: 'bad_request' }, 400); }

  const email = String(body.email || '').trim().toLowerCase();
  if (!isEmail(email)) return json({ error: 'invalid_email' }, 400);

  const groupName = pickGroupName(body.age);
  // Stored on the subscriber for future segmentation. MailerLite silently drops
  // fields that don't exist on the account, so sending these is always safe.
  const fields = {
    age_bucket: String(body.age || ''),
    position: String(body.position || ''),
    level: String(body.level || ''),
    goal: String(body.goal || ''),
  };

  try {
    // 1) Resolve the group name to its id.
    const gRes = await ml('/groups?limit=100');
    if (!gRes.ok) throw new Error(`groups lookup failed (${gRes.status})`);
    const groups = (await gRes.json()).data || [];
    const group = groups.find((g) => g.name === groupName);
    if (!group) {
      console.error(`[subscribe] MailerLite group "${groupName}" not found`);
      return json({ error: 'group_not_found' }, 500);
    }

    // 2) Upsert the subscriber straight into that group.
    const sRes = await ml('/subscribers', {
      method: 'POST',
      body: JSON.stringify({ email, groups: [group.id], fields, status: 'active' }),
    });
    if (!sRes.ok) {
      console.error(`[subscribe] MailerLite subscribe failed (${sRes.status}): ${await sRes.text().catch(() => '')}`);
      return json({ error: 'subscribe_failed' }, 502);
    }

    return json({ ok: true });
  } catch (e) {
    console.error(`[subscribe] error: ${e?.message || e}`);
    return json({ error: 'subscribe_failed' }, 502);
  }
};
