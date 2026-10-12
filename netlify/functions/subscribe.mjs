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
  '9_11':   'kids-program',     // NEW group — create this in MailerLite
  '12_14':  'youth-program',    // existing group, now serves 12–14 (was 9–13)
  '15_18':  'teen-program',     // existing group, now serves 15–18 (was 14–18)
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

// Is this email still inside the group's "[FOLLOW-UP] <group>" automation? (e.g. "[FOLLOW-UP] youth-program (12–14)")
// When MailerLite can't answer, say yes: better to skip a re-send than to cut someone's sequence short.
async function inFollowUp(groupName, email) {
  try {
    const base = groupName.replace(/-(cs|sv|de|fi)$/, '');
    const aRes = await ml('/automations?filter[enabled]=true&limit=50');
    if (!aRes.ok) throw new Error(`automations lookup failed (${aRes.status})`);
    const auto = ((await aRes.json()).data || []).find((a) => a.enabled && String(a.name || '').startsWith(`[FOLLOW-UP] ${base}`));
    if (!auto) return false; // no follow-up sequence for this group: nothing to cut short
    const r = await ml(`/automations/${auto.id}/activity?filter[status]=active&filter[search]=${encodeURIComponent(email)}&limit=1`);
    if (!r.ok) throw new Error(`activity lookup failed (${r.status})`);
    return ((await r.json()).data || []).length > 0;
  } catch (e) {
    console.error(`[subscribe] follow-up check: ${e?.message || e}`);
    return true;
  }
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

  const name = String(body.name || '').trim();
  const source = String(body.source || (body.age ? 'survey' : 'newsletter')).trim();
  // Stored on the subscriber for future segmentation. MailerLite silently drops
  // fields that don't exist on the account, so sending these is always safe.
  const fields = {
    age_bucket: String(body.age || ''),
    position: String(body.position || ''),
    level: String(body.level || ''),
    goal: String(body.goal || ''),
    source,
    lead_source: source.replace(/[^\w-]/g, '').slice(0, 40), // "source" is reserved in MailerLite; this is the field that is stored
    language: ['cs', 'sv', 'de', 'fi'].includes(body.lang) ? body.lang : 'en',
  };
  if (name) fields.name = name;

  try {
    // 1) Resolve the target group id. Survey leads (age present) go to their age
    //    group, which must exist. Newsletter signups (no age) go to a "newsletter"
    //    group if one exists, otherwise they are added with no group so a signup
    //    is never lost.
    const gRes = await ml('/groups?limit=100');
    if (!gRes.ok) throw new Error(`groups lookup failed (${gRes.status})`);
    const groups = (await gRes.json()).data || [];

    let groupIds = [];
    if (body.age) {
      const groupName = pickGroupName(body.age);
      // Translated sites send lang ('cs', 'sv', 'de' from /cs/, /sv/, /de/survey.html).
      // Those leads go to the matching "<group>-<lang>" group (e.g. "teen-program-sv")
      // once it exists in MailerLite; until then they fall back to the English group
      // so no lead is ever lost.
      const lang = ['cs', 'sv', 'de', 'fi'].includes(body.lang) ? body.lang : null;
      const langGroup = lang ? groups.find((g) => g.name === `${groupName}-${lang}`) : null;
      const group = langGroup || groups.find((g) => g.name === groupName);
      if (!group) {
        console.error(`[subscribe] MailerLite group "${groupName}" not found`);
        return json({ error: 'group_not_found' }, 500);
      }
      groupIds = [group.id];
    } else {
      const nl = groups.find((g) => g.name === 'newsletter');
      if (nl) groupIds = [nl.id];
    }

    // 2) Is this person already in that group? The group's "Send … PDF" automation fires only when
    //    someone *joins* the group, so a returning subscriber who picks the same age again would get no
    //    email at all (found 2026-10-12 with a subscriber from May).
    const target = groupIds[0] || null;
    const before = await ml(`/subscribers/${encodeURIComponent(email)}`);
    const existing = before.ok ? (await before.json()).data : null;
    const alreadyIn = !!(target && existing && (existing.groups || []).some((g) => String(g.id) === String(target)));

    // 3) Upsert the subscriber into the resolved group(s).
    const sRes = await ml('/subscribers', {
      method: 'POST',
      body: JSON.stringify({ email, groups: groupIds, fields, status: 'active' }),
    });
    if (!sRes.ok) {
      console.error(`[subscribe] MailerLite subscribe failed (${sRes.status}): ${await sRes.text().catch(() => '')}`);
      return json({ error: 'subscribe_failed' }, 502);
    }
    const saved = (await sRes.json().catch(() => ({}))).data;

    // 4) Returning subscriber: take them out of the group and put them back, so "Send … PDF" (repeatable
    //    after 1 day) emails the program again. Not while they are still inside the group's [FOLLOW-UP]
    //    sequence: leaving the group would end it, and they were sent the program days ago (the success
    //    page links the program directly anyway).
    let emailed = !alreadyIn;
    if (alreadyIn && saved?.id && body.age) {
      const groupName = (groups.find((g) => String(g.id) === String(target)) || {}).name || '';
      if (await inFollowUp(groupName, email)) {
        console.log(`[subscribe] ${groupName}: returning subscriber is mid-sequence, PDF not re-sent`);
      } else {
        await ml(`/subscribers/${saved.id}/groups/${target}`, { method: 'DELETE' });
        const add = await ml(`/subscribers/${saved.id}/groups/${target}`, { method: 'POST' });
        emailed = add.ok;
        if (!add.ok) console.error(`[subscribe] re-adding to ${groupName} failed (${add.status}): ${await add.text().catch(() => '')}`);
      }
    }

    return json({ ok: true, emailed });
  } catch (e) {
    console.error(`[subscribe] error: ${e?.message || e}`);
    return json({ error: 'subscribe_failed' }, 502);
  }
};
