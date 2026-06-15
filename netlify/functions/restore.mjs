// /api/restore -> let a buyer re-unlock their program(s) on a new device using email.
// Finds every program tied to the email, re-sends each forever-link, sets the access
// cookie, and either drops them straight into their one program or shows a chooser.
import { getStore } from '@netlify/blobs';
import { makeToken, cookie, COOKIE_NAME, sendAccessEmail, ownedPrograms, programById } from '../lib/paywall.mjs';

export const config = { path: ['/api/restore', '/restore'] };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const shell = (inner) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Restore Access — Elite Hockey Drills</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter+Tight:wght@400;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
background:#070708;color:#ECEDEF;font-family:'Inter Tight',system-ui,sans-serif}
.card{max-width:440px;width:100%;background:#0E0E13;border:1px solid #25252E;border-radius:16px;padding:32px}
h1{font-family:'Bebas Neue',sans-serif;font-weight:400;letter-spacing:.02em;font-size:34px;margin:0 0 8px}
p{color:#9398A2;font-size:14px;line-height:1.5;margin:0 0 20px}
input{width:100%;padding:12px 14px;border-radius:10px;border:1px solid #25252E;background:#14141B;color:#ECEDEF;font-size:15px;margin-bottom:14px}
button{width:100%;padding:13px;border-radius:100px;border:none;background:#E8B777;color:#0A0A0E;font-weight:600;font-size:15px;cursor:pointer}
.err{color:#E89; font-size:13px;margin:-4px 0 14px}
a{color:#5DB4E5;font-size:13px;text-decoration:none}
.prog{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 16px;border:1px solid #25252E;border-radius:12px;margin-bottom:10px}
.prog b{font-family:'Bebas Neue',sans-serif;font-weight:400;font-size:18px;letter-spacing:.02em;color:#ECEDEF}
.prog .age{display:block;color:#9398A2;font-size:12px}
.open{flex:none;background:#E8B777;color:#0A0A0E;font-weight:600;font-size:13px;padding:9px 16px;border-radius:100px;text-decoration:none}
</style></head><body><div class="card">${inner}
<p style="margin:16px 0 0"><a href="/#tiers">&larr; Back to the site</a></p>
</div></body></html>`;

const formPage = (msg = '') => shell(`<h1>Restore your access</h1>
<p>Enter the email you used at checkout and we'll unlock your program(s) on this device.</p>
${msg ? `<div class="err">${msg}</div>` : ''}
<form method="POST" action="/api/restore">
<input type="email" name="email" placeholder="you@email.com" required autofocus>
<button type="submit">Unlock my program</button>
</form>`);

const chooserPage = (programs, token) => shell(`<h1>Your programs</h1>
<p>Welcome back — here's everything tied to your email. Tap to open (we also re-sent the links to your inbox).</p>
${programs.map((id) => {
  const pr = programById(id);
  return `<div class="prog"><span><b>${esc(pr.name)}</b><span class="age">Ages ${esc(pr.age)}</span></span><a class="open" href="/program?p=${id}&t=${token}">Open &rarr;</a></div>`;
}).join('')}`);

const respond = (s, status = 200, headers = {}) =>
  new Response(s, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', ...headers } });

export default async (req) => {
  if (req.method === 'GET') return respond(formPage());

  const url = new URL(req.url);
  const fd = await req.formData();
  const email = String(fd.get('email') || '').trim().toLowerCase();
  if (!email) return respond(formPage('Please enter your email.'), 400);

  const buyers = getStore('buyers');
  const owned = await ownedPrograms(buyers, email);
  if (!owned.length) {
    return respond(formPage("We couldn't find a purchase under that email. Double-check the spelling, and try any other address you may have used (Apple Pay can use a private relay email). Still stuck? Email elitehockeydrills@gmail.com."), 404);
  }

  // Re-send each owned program's permanent magic link (best-effort) so even a buyer who
  // deleted the email gets their forever-keys back — not just a transient cookie.
  try {
    for (const id of owned) {
      const longToken = await makeToken(process.env.COOKIE_SECRET, email, 60 * 60 * 24 * 365 * 10);
      const pr = programById(id);
      await sendAccessEmail({ to: email, link: `${url.origin}/program?p=${id}&t=${longToken}`, programName: pr.name, programAge: pr.age });
    }
  } catch (e) {
    console.error('restore email failed:', e.message);
  }

  const token = await makeToken(process.env.COOKIE_SECRET, email);
  const setCookie = cookie(COOKIE_NAME, token, 60 * 60 * 24 * 365);

  // One program -> straight in. Multiple -> let them choose.
  if (owned.length === 1) {
    return new Response(null, { status: 302, headers: { Location: `${url.origin}/program?p=${owned[0]}`, 'Set-Cookie': setCookie } });
  }
  return respond(chooserPage(owned, token), 200, { 'Set-Cookie': setCookie });
};
