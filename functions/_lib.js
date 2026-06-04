// Shared helpers for the payment gate (Cloudflare Pages Functions).
// Files prefixed with "_" are not routed but can be imported.

export const COOKIE_NAME = 'ehd_access';
export const ASSET_KEY = 'program.html'; // object key in the R2 bucket
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
  (request.headers.get('Cookie') || '').split(/; */).forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  });
  return out;
}

// ---- Stripe REST (no SDK, runs on Workers runtime) ----
function formEncode(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}
export async function stripe(env, method, path, params) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params ? formEncode(params) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Stripe error ${res.status}`);
  return data;
}
