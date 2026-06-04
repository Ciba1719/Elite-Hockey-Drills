// GET /program -> serve the paid program from R2, only with a valid access cookie.
import { verifyToken, parseCookies, COOKIE_NAME, ASSET_KEY } from './_lib.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = parseCookies(request)[COOKIE_NAME];
  const valid = await verifyToken(env.COOKIE_SECRET, token);
  if (!valid) return Response.redirect(url.origin + '/#tiers', 302);

  const obj = await env.PROGRAM.get(ASSET_KEY);
  if (!obj) return new Response('Program not available. Please contact support.', { status: 404 });

  return new Response(obj.body, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  });
}
