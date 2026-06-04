// /api/restore -> let a buyer re-unlock the program on a new device using their email.
import { makeToken, cookie, COOKIE_NAME } from '../_lib.js';

const page = (msg = '') => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Restore Access — Elite Hockey Drills</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter+Tight:wght@400;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
background:#070708;color:#ECEDEF;font-family:'Inter Tight',system-ui,sans-serif}
.card{max-width:420px;width:100%;background:#0E0E13;border:1px solid #25252E;border-radius:16px;padding:32px}
h1{font-family:'Bebas Neue',sans-serif;font-weight:400;letter-spacing:.02em;font-size:34px;margin:0 0 8px}
p{color:#9398A2;font-size:14px;line-height:1.5;margin:0 0 20px}
input{width:100%;padding:12px 14px;border-radius:10px;border:1px solid #25252E;background:#14141B;color:#ECEDEF;font-size:15px;margin-bottom:14px}
button{width:100%;padding:13px;border-radius:100px;border:none;background:#E8B777;color:#0A0A0E;font-weight:600;font-size:15px;cursor:pointer}
.err{color:#E89; font-size:13px;margin:-4px 0 14px}
a{color:#5DB4E5;font-size:13px;text-decoration:none}
</style></head><body><div class="card">
<h1>Restore your access</h1>
<p>Enter the email you used at checkout and we'll unlock your program on this device.</p>
${msg ? `<div class="err">${msg}</div>` : ''}
<form method="POST" action="/api/restore">
<input type="email" name="email" placeholder="you@email.com" required autofocus>
<button type="submit">Unlock my program</button>
</form>
<p style="margin:16px 0 0"><a href="/#tiers">&larr; Back to the site</a></p>
</div></body></html>`;

const html = (s, status = 200) =>
  new Response(s, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

export async function onRequestGet() {
  return html(page());
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const fd = await request.formData();
  const email = String(fd.get('email') || '').trim().toLowerCase();
  if (!email) return html(page('Please enter your email.'), 400);

  const rec = await env.BUYERS.get('buyer:' + email);
  if (!rec) return html(page("We couldn't find a purchase for that email. Check the address or contact support."), 404);

  const token = await makeToken(env.COOKIE_SECRET, email);
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.origin + '/program',
      'Set-Cookie': cookie(COOKIE_NAME, token, 60 * 60 * 24 * 365),
    },
  });
}
