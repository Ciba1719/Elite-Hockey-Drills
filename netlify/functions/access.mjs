// GET /api/access?session_id=... -> verify payment, record buyer, set cookie, open program.
import { getStore } from '@netlify/blobs';
import { stripe, makeToken, cookie, COOKIE_NAME } from '../lib/paywall.mjs';

export const config = { path: '/api/access' };

export default async (req) => {
  const url = new URL(req.url);
  const sid = url.searchParams.get('session_id');
  if (!sid) return Response.redirect(url.origin + '/#tiers', 302);

  try {
    const session = await stripe(process.env.STRIPE_SECRET_KEY, 'GET', `checkout/sessions/${sid}`);
    if (session.payment_status !== 'paid') {
      return Response.redirect(url.origin + '/#tiers', 302);
    }

    const email = (session.customer_details?.email || '').trim().toLowerCase();
    if (email) {
      await getStore('buyers').setJSON('buyer:' + email, { sid, t: Date.now() });
    }

    const token = await makeToken(process.env.COOKIE_SECRET, email || 'buyer');
    return new Response(null, {
      status: 302,
      headers: {
        Location: url.origin + '/program',
        'Set-Cookie': cookie(COOKIE_NAME, token, 60 * 60 * 24 * 365),
      },
    });
  } catch (e) {
    return new Response(`Access error: ${e.message}`, { status: 500 });
  }
};
