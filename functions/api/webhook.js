// POST /api/webhook -> Stripe sends checkout.session.completed here.
// Source of truth for "who paid" even if the buyer closes the tab before redirect.
import { hmacHex, timingSafeEqual } from '../_lib.js';

export async function onRequestPost({ request, env }) {
  const sigHeader = request.headers.get('stripe-signature') || '';
  const body = await request.text();

  const parts = {};
  sigHeader.split(',').forEach((kv) => {
    const i = kv.indexOf('=');
    if (i > 0) parts[kv.slice(0, i)] = kv.slice(i + 1);
  });
  if (!parts.t || !parts.v1) return new Response('Bad signature', { status: 400 });

  const expected = await hmacHex(env.STRIPE_WEBHOOK_SECRET, `${parts.t}.${body}`);
  if (!timingSafeEqual(expected, parts.v1)) return new Response('Invalid signature', { status: 400 });

  let event;
  try { event = JSON.parse(body); } catch { return new Response('Bad JSON', { status: 400 }); }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    if (s.payment_status === 'paid') {
      const email = (s.customer_details?.email || '').trim().toLowerCase();
      if (email) await env.BUYERS.put('buyer:' + email, JSON.stringify({ sid: s.id, t: Date.now() }));
    }
  }

  return new Response('ok', { status: 200 });
}
