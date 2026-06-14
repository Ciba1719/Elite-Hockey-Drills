// GET /buy -> branded on-site checkout using Stripe Embedded Checkout.
// Creates an *embedded* Checkout Session server-side and renders Stripe's payment
// form INSIDE elitehockeydrills.com (no redirect to checkout.stripe.com). On a
// successful payment Stripe returns the buyer to /welcome?session_id=... — the
// existing access flow (cookie, /program, webhook, email, restore) is unchanged.
import { stripe } from '../lib/paywall.mjs';

export const config = { path: '/buy' };

const page = (clientSecret, pk) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#070708" />
<meta name="robots" content="noindex" />
<title>Checkout — Elite Hockey Drills</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Serif:ital@1&family=Inter+Tight:wght@400;500;600;700&display=swap" rel="stylesheet" />
<script src="https://js.stripe.com/v3/"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}html{-webkit-text-size-adjust:100%}
body{min-height:100vh;background:#070708;color:#ECEDEF;font-family:'Inter Tight',system-ui,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;padding:24px 20px 40px}
.glow{position:fixed;inset:0;background:radial-gradient(60% 50% at 50% 0%,rgba(232,183,119,.10),transparent 70%);pointer-events:none}
.wrap{position:relative;max-width:540px;margin:0 auto}
.top{text-align:center;padding:8px 0 24px}
.brand{font-family:'Bebas Neue',sans-serif;letter-spacing:.14em;font-size:14px;color:#5A5F6B;text-decoration:none}
.summary{background:#0E0E13;border:1px solid #25252E;border-radius:16px;padding:20px 24px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;gap:16px}
.summary .eyebrow{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#E8B777;margin-bottom:6px}
.summary h1{font-family:'Bebas Neue',sans-serif;font-weight:400;font-size:30px;line-height:1;letter-spacing:.01em}
.summary .price{font-family:'Bebas Neue',sans-serif;font-size:34px;color:#E8B777;text-align:right;white-space:nowrap}
.summary .price small{display:block;font-family:'Inter Tight',sans-serif;font-size:10.5px;color:#9398A2;letter-spacing:.04em;font-weight:600;text-transform:uppercase}
#checkout{background:#fff;border-radius:16px;overflow:hidden;min-height:420px}
.err{display:none;background:rgba(229,93,93,.08);border:1px solid rgba(229,93,93,.3);border-radius:12px;padding:14px 16px;font-size:13.5px;color:#E8A0A0;margin-top:4px}
.secure{text-align:center;font-size:12.5px;color:#5A5F6B;margin-top:18px}.secure strong{color:#9398A2}
.back{display:block;text-align:center;margin-top:14px;font-size:13px;color:#5DB4E5;text-decoration:none}
</style></head><body><div class="glow"></div>
<div class="wrap">
  <div class="top"><a class="brand" href="/">ELITE HOCKEY DRILLS</a></div>
  <div class="summary">
    <div>
      <div class="eyebrow">Founding price · Ages 19–39</div>
      <h1>Power &amp; Speed</h1>
    </div>
    <div class="price">$49<small>One-time · forever</small></div>
  </div>
  <div id="err" class="err">Couldn't load the payment form. Please refresh, or email elitehockeydrills@gmail.com.</div>
  <div id="checkout"></div>
  <p class="secure">&#128274; Secure payment by <strong>Stripe</strong> · Apple Pay &amp; cards accepted</p>
  <a class="back" href="/#tiers">&larr; Back to programs</a>
</div>
<script>
  (async () => {
    try {
      const stripe = Stripe(${JSON.stringify(pk)});
      const checkout = await stripe.initEmbeddedCheckout({
        fetchClientSecret: () => Promise.resolve(${JSON.stringify(clientSecret)}),
      });
      checkout.mount('#checkout');
    } catch (e) {
      document.getElementById('err').style.display = 'block';
    }
  })();
</script>
</body></html>`;

export default async (req) => {
  const origin = new URL(req.url).origin;
  const pk = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!pk) return new Response('Checkout is not configured yet (missing STRIPE_PUBLISHABLE_KEY).', { status: 500 });
  try {
    const session = await stripe(process.env.STRIPE_SECRET_KEY, 'POST', 'checkout/sessions', {
      mode: 'payment',
      ui_mode: 'embedded',
      'line_items[0][price]': process.env.STRIPE_PRICE_ID,
      'line_items[0][quantity]': '1',
      return_url: `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      allow_promotion_codes: 'true',
    });
    return new Response(page(session.client_secret, pk), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e) {
    return new Response(`Checkout error: ${e.message}`, { status: 500 });
  }
};
