// GET /buy?p=<program> -> branded on-site checkout using Stripe Embedded Checkout.
// Creates an *embedded* Checkout Session server-side and renders Stripe's payment
// form INSIDE elitehockeydrills.com (no redirect to checkout.stripe.com). On a
// successful payment Stripe returns the buyer to /welcome?session_id=... — the
// existing access flow (cookie, /program, webhook, email, restore) is unchanged.
// `?p=` selects which of the 5 age-group programs is bought (defaults to 19-39).
import { stripe, getProgram, programById, programPriceId, SUPPORT_EMAIL } from '../lib/paywall.mjs';

export const config = { path: '/buy' };

// Format the real amount Stripe will charge (from the created session) so the
// summary box can never show a stale, hardcoded price. `amount` is an integer in
// the currency's smallest unit (e.g. cents / fils).
function priceLabel(amount, currency) {
  if (amount == null || !currency) return '';
  const v = amount / 100;
  const n = Number.isInteger(v) ? String(v) : v.toFixed(2);
  const sym = { usd: '$', aed: 'AED ', eur: '€', gbp: '£', cad: 'CA$', aud: 'A$' }[currency.toLowerCase()];
  return sym ? `${sym}${n}` : `${currency.toUpperCase()} ${n}`;
}

const page = (clientSecret, pk, priceText, prog) => `<!doctype html><html lang="en"><head>
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
      <div class="eyebrow">Founding price · Ages ${prog.age}</div>
      <h1>${prog.name.replace(/&/g, '&amp;')}</h1>
    </div>
    <div class="price">${priceText}<small>One-time · forever</small></div>
  </div>
  <div id="err" class="err">Couldn't load the payment form. Please refresh, or email elitehockeydrills@gmail.com.</div>
  <div id="checkout"></div>
  <p class="secure">&#128274; Secure payment by <strong>Stripe</strong> · Apple Pay &amp; cards accepted</p>
  <a class="back" href="${prog.sales}">&larr; Back to program</a>
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

// Branded fallback shown whenever a checkout session can't be created (Stripe
// outage, a mis-configured price, a missing key). The buyer sees a calm
// "try again / email us" page instead of raw Stripe or internal config text,
// and the real cause is written to the Netlify function logs for diagnosis.
function errorResponse(prog) {
  const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#070708" />
<meta name="robots" content="noindex" />
<title>Checkout — Elite Hockey Drills</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter+Tight:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
*{box-sizing:border-box;margin:0;padding:0}html{-webkit-text-size-adjust:100%}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#070708;color:#ECEDEF;font-family:'Inter Tight',system-ui,sans-serif;line-height:1.65;-webkit-font-smoothing:antialiased;padding:32px 22px;text-align:center}
.glow{position:fixed;inset:0;background:radial-gradient(60% 50% at 50% 0%,rgba(232,183,119,.10),transparent 70%);pointer-events:none}
.card{position:relative;max-width:440px}
.brand{font-family:'Bebas Neue',sans-serif;letter-spacing:.14em;font-size:13px;color:#5A5F6B;text-decoration:none;display:block;margin-bottom:30px}
h1{font-family:'Bebas Neue',sans-serif;font-weight:400;font-size:36px;line-height:1.04;letter-spacing:.01em;margin-bottom:16px}
p{font-size:15px;color:#C8CCD3;margin-bottom:12px}
.mail{color:#E8B777;text-decoration:none;font-weight:600}
.back{display:inline-block;margin-top:24px;font-size:13.5px;color:#5DB4E5;text-decoration:none}
</style></head><body><div class="glow"></div>
<div class="card">
  <a class="brand" href="/">ELITE HOCKEY DRILLS</a>
  <h1>Checkout is taking a break</h1>
  <p>We couldn't start your payment just now &mdash; this one's on us, not you. <strong>No charge was made.</strong></p>
  <p>Please try again in a minute. If it keeps happening, email <a class="mail" href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> and we'll get you in fast.</p>
  <a class="back" href="${prog.sales}">&larr; Back to ${prog.name.replace(/&/g, '&amp;')}</a>
</div>
</body></html>`;
  return new Response(html, {
    status: 500,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store' },
  });
}

export default async (req) => {
  const url = new URL(req.url);
  const origin = url.origin;
  const id = getProgram(url.searchParams.get('p'));
  const prog = programById(id);
  const pk = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!pk) {
    console.error('[buy] STRIPE_PUBLISHABLE_KEY is not set');
    return errorResponse(prog);
  }
  const priceId = programPriceId(id);
  if (!priceId) {
    console.error(`[buy] no Stripe price configured for program ${id}`);
    return errorResponse(prog);
  }
  try {
    const session = await stripe(process.env.STRIPE_SECRET_KEY, 'POST', 'checkout/sessions', {
      mode: 'payment',
      ui_mode: 'embedded_page', // Stripe renamed 'embedded' -> 'embedded_page' (2026-03-25.dahlia)
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'metadata[program]': id,
      return_url: `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      allow_promotion_codes: 'true',
    });
    return new Response(page(session.client_secret, pk, priceLabel(session.amount_total, session.currency), prog), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e) {
    console.error(`[buy] checkout session failed for program ${id}: ${e?.message || e}`);
    return errorResponse(prog);
  }
};
