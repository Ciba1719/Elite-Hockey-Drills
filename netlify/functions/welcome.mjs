// GET /welcome?session_id=... -> branded "you're in" confirmation after Stripe checkout.
// Verifies the paid session, records the buyer, sets the access cookie on THIS 200
// response (reliable on iOS Safari), and shows a button into the program plus the
// "your email is your forever key" messaging.
import { getStore } from '@netlify/blobs';
import { stripe, makeToken, cookie, COOKIE_NAME } from '../lib/paywall.mjs';

export const config = { path: '/welcome' };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const page = (email, token, emailed) => {
  const e = esc(email);
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#070708" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="EHD Program" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<title>You're in — Elite Hockey Drills</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Serif:ital@1&family=Inter+Tight:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
*{box-sizing:border-box;margin:0;padding:0}html{-webkit-text-size-adjust:100%}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#070708;color:#ECEDEF;font-family:'Inter Tight',system-ui,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
.glow{position:fixed;inset:0;background:radial-gradient(60% 50% at 50% 0%,rgba(232,183,119,.10),transparent 70%);pointer-events:none}
.card{position:relative;max-width:520px;width:100%;background:#0E0E13;border:1px solid #25252E;border-radius:20px;padding:40px 30px;text-align:center}
.check{width:62px;height:62px;border-radius:50%;margin:0 auto 22px;display:flex;align-items:center;justify-content:center;background:rgba(79,179,113,.12);border:1px solid rgba(79,179,113,.5);color:#4FB371;font-size:28px}
.eyebrow{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#E8B777;margin-bottom:12px}
h1{font-family:'Bebas Neue',sans-serif;font-weight:400;font-size:54px;line-height:.95;letter-spacing:.01em;margin-bottom:12px}
h1 em{font-family:'Instrument Serif',serif;font-style:italic;color:#5DB4E5;font-size:.82em}
.lead{color:#C8CCD3;font-size:16px;margin-bottom:28px}.lead strong{color:#ECEDEF}
.cta{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:17px 28px;border-radius:100px;background:#E8B777;color:#1A0F00;font-size:16px;font-weight:700;letter-spacing:.01em;text-decoration:none;transition:transform .15s,box-shadow .15s}
.cta:hover{transform:translateY(-2px);box-shadow:0 16px 32px -10px rgba(232,183,119,.45)}
.tied{font-size:13.5px;color:#9398A2;margin-top:16px}.tied strong{color:#5DB4E5}
.rules{text-align:left;margin-top:28px;border-top:1px solid #1B1B22;padding-top:22px;display:flex;flex-direction:column;gap:13px}
.rules>div{display:flex;gap:12px;align-items:flex-start;font-size:14px;color:#C8CCD3}
.rules strong{color:#ECEDEF;font-weight:600}.rules a{color:#5DB4E5;text-decoration:none;font-weight:600}
.emailed{margin-top:20px;background:rgba(93,180,229,.08);border:1px solid rgba(93,180,229,.25);border-radius:12px;padding:14px 16px;font-size:13.5px;color:#C8CCD3}.emailed strong{color:#ECEDEF}
.hint{margin-top:20px;font-size:12.5px;color:#5A5F6B}.hint strong{color:#9398A2}
.logo{display:inline-block;margin-top:26px;font-family:'Bebas Neue',sans-serif;letter-spacing:.14em;font-size:13px;color:#5A5F6B;text-decoration:none}
@media(min-width:560px){h1{font-size:64px}.card{padding:48px 40px}}
</style></head><body><div class="glow"></div>
<div class="card">
<div class="check">&#10003;</div>
<div class="eyebrow">Payment confirmed</div>
<h1>You're <em>in.</em></h1>
<p class="lead">Welcome to <strong>Power &amp; Speed</strong> — your 8-week off-ice program. Let's get to work.</p>
<a class="cta" href="/program?t=${token}">Open my program &rarr;</a>
${e ? `<p class="tied">Your access is tied to <strong>${e}</strong> — that's your key.</p>` : ''}
<div class="rules">
<div><span>&#8734;</span><span><strong>Yours forever.</strong> One purchase, lifetime access.</span></div>
<div><span>&#8617;</span><span>Re-open anytime at <strong>elitehockeydrills.com/program</strong> on this device.</span></div>
<div><span>&#9993;</span><span>New phone or lost access? <a href="/api/restore">Restore it with your email</a> — no password needed.</span></div>
</div>
${emailed ? `<p class="emailed">&#128233; We're also sending your <strong>permanent access link</strong>${e ? ` to ${e}` : ''} so you have it on every device. Not in your inbox in a few minutes? No worries &mdash; you can always restore access with your email.</p>` : ''}
<p class="hint">On your phone? Tap <strong>Share &rarr; Add to Home Screen</strong> to keep it one tap away.</p>
<a class="logo" href="/">ELITE HOCKEY DRILLS</a>
</div></body></html>`;
};

export default async (req) => {
  const url = new URL(req.url);
  const sid = url.searchParams.get('session_id');
  if (!sid) return Response.redirect(url.origin + '/#tiers', 302);

  try {
    const session = await stripe(process.env.STRIPE_SECRET_KEY, 'GET', `checkout/sessions/${sid}`);
    if (session.payment_status !== 'paid') return Response.redirect(url.origin + '/#tiers', 302);

    const email = (session.customer_details?.email || '').trim().toLowerCase();
    if (email) await getStore('buyers').setJSON('buyer:' + email, { sid, t: Date.now() });

    const token = await makeToken(process.env.COOKIE_SECRET, email || 'buyer');
    return new Response(page(email, token, !!process.env.RESEND_API_KEY), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-store',
        'Set-Cookie': cookie(COOKIE_NAME, token, 60 * 60 * 24 * 365),
      },
    });
  } catch (e) {
    return new Response(`Welcome error: ${e.message}`, { status: 500 });
  }
};
