// POST /api/webhook -> Stripe sends checkout.session.completed here.
// Source of truth for "who paid" even if the buyer closes the tab before redirect.
import { getStore } from '@netlify/blobs';
import { hmacHex, timingSafeEqual, makeToken, sendAccessEmail } from '../lib/paywall.mjs';

export const config = { path: '/api/webhook' };

export default async (req) => {
  const sigHeader = req.headers.get('stripe-signature') || '';
  const body = await req.text();

  const parts = {};
  sigHeader.split(',').forEach((kv) => {
    const i = kv.indexOf('=');
    if (i > 0) parts[kv.slice(0, i)] = kv.slice(i + 1);
  });
  if (!parts.t || !parts.v1) return new Response('Bad signature', { status: 400 });

  const expected = await hmacHex(process.env.STRIPE_WEBHOOK_SECRET, `${parts.t}.${body}`);
  if (!timingSafeEqual(expected, parts.v1)) return new Response('Invalid signature', { status: 400 });

  let event;
  try { event = JSON.parse(body); } catch { return new Response('Bad JSON', { status: 400 }); }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    if (s.payment_status === 'paid') {
      const email = (s.customer_details?.email || '').trim().toLowerCase();
      if (email) {
        await getStore('buyers').setJSON('buyer:' + email, { sid: s.id, t: Date.now() });
        // Send the "your program, forever" email. Best-effort: never let an email
        // failure 500 the webhook, or Stripe will retry and re-send.
        try {
          const origin = process.env.SITE_URL || new URL(req.url).origin;
          const token = await makeToken(process.env.COOKIE_SECRET, email, 60 * 60 * 24 * 365 * 10);
          await sendAccessEmail({ to: email, name: s.customer_details?.name, link: `${origin}/program?t=${token}` });
        } catch (e) {
          console.error('access email failed:', e.message);
        }
      }
    }
  }

  return new Response('ok', { status: 200 });
};
