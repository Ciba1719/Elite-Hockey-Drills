// GET /api/checkout -> create a one-time Stripe Checkout Session and redirect to it.
import { stripe } from '../_lib.js';

export async function onRequestGet({ request, env }) {
  const origin = new URL(request.url).origin;
  try {
    const session = await stripe(env, 'POST', 'checkout/sessions', {
      mode: 'payment',
      'line_items[0][price]': env.STRIPE_PRICE_ID,
      'line_items[0][quantity]': '1',
      success_url: `${origin}/api/access?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#tiers`,
      allow_promotion_codes: 'true',
    });
    return Response.redirect(session.url, 303);
  } catch (e) {
    return new Response(`Checkout error: ${e.message}`, { status: 500 });
  }
}
