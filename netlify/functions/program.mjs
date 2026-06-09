// GET /program -> serve the paid program from Netlify Blobs.
// Access is granted by EITHER a valid signed cookie (returning buyer) OR a paid
// Stripe session_id in the URL (buyer arriving straight from checkout). The
// session_id path also sets the cookie in the same 200 response, which browsers
// store reliably — avoiding the "cookie lost during redirect" problem on iOS Safari.
import { getStore } from '@netlify/blobs';
import { stripe, makeToken, verifyToken, parseCookies, cookie, COOKIE_NAME, PROGRAM_KEY } from '../lib/paywall.mjs';

export const config = { path: '/program' };

async function serveProgram(extraHeaders = {}) {
  const html = await getStore('program').get(PROGRAM_KEY, { type: 'text' });
  if (!html) return new Response('Program not available. Please contact support.', { status: 404 });
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', ...extraHeaders },
  });
}

export default async (req) => {
  const url = new URL(req.url);

  // 1) Returning buyer with a valid access cookie on this device.
  const valid = await verifyToken(process.env.COOKIE_SECRET, parseCookies(req)[COOKIE_NAME]);
  if (valid) return serveProgram();

  // 2) Arriving straight from Stripe checkout with a paid session — verify it,
  //    record the buyer, set the cookie, and serve in one response.
  const sid = url.searchParams.get('session_id');
  if (sid) {
    try {
      const session = await stripe(process.env.STRIPE_SECRET_KEY, 'GET', `checkout/sessions/${sid}`);
      if (session.payment_status === 'paid') {
        const email = (session.customer_details?.email || '').trim().toLowerCase();
        if (email) await getStore('buyers').setJSON('buyer:' + email, { sid, t: Date.now() });
        const token = await makeToken(process.env.COOKIE_SECRET, email || 'buyer');
        return serveProgram({ 'Set-Cookie': cookie(COOKIE_NAME, token, 60 * 60 * 24 * 365) });
      }
    } catch {
      // fall through to the redirect below
    }
  }

  // 3) No valid access.
  return Response.redirect(url.origin + '/#tiers', 302);
};
