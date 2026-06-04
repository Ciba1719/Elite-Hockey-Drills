// GET /api/access?session_id=... -> verify payment, record buyer, set cookie, open program.
import { stripe, makeToken, cookie, COOKIE_NAME } from '../_lib.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const sid = url.searchParams.get('session_id');
  if (!sid) return Response.redirect(url.origin + '/#tiers', 302);

  try {
    const session = await stripe(env, 'GET', `checkout/sessions/${sid}`);
    if (session.payment_status !== 'paid') {
      return Response.redirect(url.origin + '/#tiers', 302);
    }

    const email = (session.customer_details?.email || '').trim().toLowerCase();
    if (email) {
      await env.BUYERS.put('buyer:' + email, JSON.stringify({ sid, t: Date.now() }));
    }

    const token = await makeToken(env.COOKIE_SECRET, email || 'buyer');
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
}
