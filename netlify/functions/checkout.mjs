// GET /api/checkout -> create a one-time Stripe Checkout Session and redirect to it.
import { stripe } from '../lib/paywall.mjs';

export const config = { path: '/api/checkout' };

export default async (req) => {
  const origin = new URL(req.url).origin;
  try {
    const session = await stripe(process.env.STRIPE_SECRET_KEY, 'POST', 'checkout/sessions', {
      mode: 'payment',
      'line_items[0][price]': process.env.STRIPE_PRICE_ID,
      'line_items[0][quantity]': '1',
      success_url: `${origin}/program?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#tiers`,
      allow_promotion_codes: 'true',
    });
    return Response.redirect(session.url, 303);
  } catch (e) {
    return new Response(`Checkout error: ${e.message}`, { status: 500 });
  }
};
