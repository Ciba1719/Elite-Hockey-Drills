// Shared helpers for the Netlify payment gate.
// Ported from the original Cloudflare Pages Functions `_lib.js` — same crypto,
// cookie, and Stripe logic, adapted to the Netlify Functions v2 runtime
// (standard Web Request/Response; global `crypto`, `fetch`, `btoa`/`atob`).

export const COOKIE_NAME = 'ehd_access';
export const PROGRAM_KEY = 'program'; // object key in the Netlify Blobs "program" store
const enc = new TextEncoder();

// ---- base64url ----
export function b64url(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function b64urlToBytes(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = str.length % 4 ? 4 - (str.length % 4) : 0;
  str += '='.repeat(pad);
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ---- HMAC-SHA256 ----
async function importKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}
export async function hmacB64url(secret, data) {
  const sig = await crypto.subtle.sign('HMAC', await importKey(secret), enc.encode(data));
  return b64url(new Uint8Array(sig));
}
export async function hmacHex(secret, data) {
  const sig = await crypto.subtle.sign('HMAC', await importKey(secret), enc.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// ---- access token (signed cookie value) ----
export async function makeToken(secret, email, ttlSeconds = 60 * 60 * 24 * 365) {
  const payload = JSON.stringify({ e: email, x: Math.floor(Date.now() / 1000) + ttlSeconds });
  const p = b64url(enc.encode(payload));
  const sig = await hmacB64url(secret, p);
  return `${p}.${sig}`;
}
export async function verifyToken(secret, token) {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot < 0) return null;
  const p = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!timingSafeEqual(sig, await hmacB64url(secret, p))) return null;
  let obj;
  try { obj = JSON.parse(new TextDecoder().decode(b64urlToBytes(p))); } catch { return null; }
  if (!obj || !obj.x || obj.x < Math.floor(Date.now() / 1000)) return null;
  return { email: obj.e };
}

// ---- cookies ----
export function cookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
export function parseCookies(request) {
  const out = {};
  (request.headers.get('cookie') || '').split(/; */).forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  });
  return out;
}

// ---- Stripe REST (no SDK) ----
function formEncode(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}
export async function stripe(secretKey, method, path, params) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params ? formEncode(params) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Stripe error ${res.status}`);
  return data;
}

// ---- Access email (Resend) ----
export const SUPPORT_EMAIL = 'elitehockeydrills@gmail.com';
const EMAIL_FROM = 'Elite Hockey Drills <access@elitehockeydrills.com>';
const RESTORE_URL = 'https://elitehockeydrills.com/restore';
const escHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function accessEmailHtml({ name, link }) {
  const hi = name ? `, ${escHtml(name)}` : '';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 14px;">
<tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#0E0E13;border:1px solid #25252E;border-radius:16px;">
<tr><td style="padding:28px 32px 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-weight:700;letter-spacing:3px;font-size:15px;color:#E8B777;">ELITE HOCKEY DRILLS</td></tr>
<tr><td style="padding:22px 32px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;color:#E8B777;text-transform:uppercase;">Power &amp; Speed &middot; Ages 19&ndash;39</td></tr>
<tr><td style="padding:6px 32px 0;"><h1 style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:25px;line-height:1.25;color:#ECEDEF;">Your program is ready &mdash; forever.</h1>
<p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#C8CCD3;">Thanks for joining${hi}. Tap below to open your full 12-week off-ice program. <strong style="color:#ECEDEF;">Keep this email</strong> &mdash; this link is yours forever and works on any device, anytime.</p></td></tr>
<tr><td align="center" style="padding:0 32px;"><a href="${link}" style="display:inline-block;background:#E8B777;color:#1A0F00;text-decoration:none;font-weight:700;font-size:16px;font-family:Arial,Helvetica,sans-serif;padding:15px 38px;border-radius:100px;">Open my program &rarr;</a></td></tr>
<tr><td style="padding:16px 32px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#5A5F6B;">Button not working? Copy this link:<br><span style="color:#5DB4E5;word-break:break-all;">${link}</span></td></tr>
<tr><td style="padding:22px 32px;"><div style="height:1px;background:#1B1B22;line-height:1px;font-size:0;">&nbsp;</div></td></tr>
<tr><td style="padding:0 32px 6px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#9398A2;">New phone or lost access? Restore anytime with your email at <a href="${RESTORE_URL}" style="color:#5DB4E5;">elitehockeydrills.com/restore</a>.</td></tr>
<tr><td style="padding:14px 32px 30px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#5A5F6B;">Questions? Just reply to this email, or reach us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#9398A2;">${SUPPORT_EMAIL}</a>.<br>&copy; Elite Hockey Drills &middot; Off-ice training engineered for hockey.</td></tr>
</table></td></tr></table></body></html>`;
}

function accessEmailText({ link }) {
  return [
    'Your Power & Speed program is ready — forever.',
    '',
    'Open it here (keep this link — it works on any device, anytime):',
    link,
    '',
    'New phone or lost access? Restore anytime with your email at ' + RESTORE_URL,
    '',
    'Questions? Reply to this email or contact ' + SUPPORT_EMAIL + '.',
    '',
    '— Elite Hockey Drills',
  ].join('\n');
}

// Best-effort transactional "your program, forever" email via Resend. Returns false
// (without throwing) if email isn't configured yet or there is no recipient; throws
// only on a genuine send failure so callers can log it without breaking their flow.
export async function sendAccessEmail({ to, name, link }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      reply_to: SUPPORT_EMAIL,
      subject: 'Your Power & Speed program — open it anytime',
      html: accessEmailHtml({ name, link }),
      text: accessEmailText({ link }),
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text().catch(() => '')}`);
  return true;
}
