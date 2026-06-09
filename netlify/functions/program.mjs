// GET /program -> serve the paid program from Netlify Blobs.
// Access is granted by ANY of: a valid signed cookie (returning buyer), a permanent
// signed email token in ?t= (the magic link we email), or a paid Stripe session_id
// (buyer arriving from checkout). Each path sets/refreshes the cookie in the same 200
// response, which browsers store reliably — avoiding the "cookie lost during redirect"
// problem on iOS Safari.
import { getStore } from '@netlify/blobs';
import { stripe, makeToken, verifyToken, parseCookies, cookie, COOKIE_NAME, PROGRAM_KEY } from '../lib/paywall.mjs';

export const config = { path: '/program' };

const YEAR = 60 * 60 * 24 * 365;

async function serveProgram(extraHeaders = {}) {
  const html = await getStore('program').get(PROGRAM_KEY, { type: 'text' });
  if (!html) return new Response('Program not available. Please contact support.', { status: 404 });
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', ...extraHeaders },
  });
}

// Re-mint the access cookie on every successful visit (sliding renewal — active
// buyers effectively never get re-gated).
async function refreshHeader(email) {
  const fresh = await makeToken(process.env.COOKIE_SECRET, email || 'buyer');
  return { 'Set-Cookie': cookie(COOKIE_NAME, fresh, YEAR) };
}

export default async (req) => {
  const url = new URL(req.url);

  // 1) Returning buyer with a valid access cookie on this device.
  const valid = await verifyToken(process.env.COOKIE_SECRET, parseCookies(req)[COOKIE_NAME]);
  if (valid) return serveProgram(await refreshHeader(valid.email));

  // 2) Permanent magic link from the buyer's email — a signed, email-bound token (?t=).
  const t = url.searchParams.get('t');
  if (t) {
    const v = await verifyToken(process.env.COOKIE_SECRET, t);
    if (v) return serveProgram(await refreshHeader(v.email));
  }

  // 3) Arriving straight from Stripe checkout with a paid session — verify, record, serve.
  const sid = url.searchParams.get('session_id');
  if (sid) {
    try {
      const session = await stripe(process.env.STRIPE_SECRET_KEY, 'GET', `checkout/sessions/${sid}`);
      if (session.payment_status === 'paid') {
        const email = (session.customer_details?.email || '').trim().toLowerCase();
        if (email) await getStore('buyers').setJSON('buyer:' + email, { sid, t: Date.now() });
        return serveProgram(await refreshHeader(email));
      }
    } catch {
      // fall through to the redirect below
    }
  }

  // 4) No valid access.
  return Response.redirect(url.origin + '/#tiers', 302);
};
