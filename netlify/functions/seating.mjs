// /api/seating -> shared storage for the (unlisted) wedding seating chart.
// GET returns the current plan; POST overwrites it. Anyone with the link can
// read/write — that's intentional, so the couple + family edit one shared chart.
// Last write wins; `updatedAt` lets clients poll for each other's changes.
import { getStore } from '@netlify/blobs';

export const config = { path: '/api/seating' };

const KEY = 'plan';
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export default async (req) => {
  const store = getStore('seating');

  if (req.method === 'GET') {
    const data = await store.get(KEY, { type: 'json' });
    return json(data || { guests: {}, nextId: 1, updatedAt: 0 });
  }

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
    const plan = {
      guests: body.guests && typeof body.guests === 'object' ? body.guests : {},
      nextId: Number.isFinite(body.nextId) ? body.nextId : 1,
      updatedAt: Date.now(),
    };
    await store.setJSON(KEY, plan);
    return json({ ok: true, updatedAt: plan.updatedAt });
  }

  return json({ error: 'method_not_allowed' }, 405);
};
