// GET /program -> serve the paid program from Netlify Blobs, only with a valid access cookie.
import { getStore } from '@netlify/blobs';
import { verifyToken, parseCookies, COOKIE_NAME, PROGRAM_KEY } from '../lib/paywall.mjs';

export const config = { path: '/program' };

export default async (req) => {
  const url = new URL(req.url);
  const valid = await verifyToken(process.env.COOKIE_SECRET, parseCookies(req)[COOKIE_NAME]);
  if (!valid) return Response.redirect(url.origin + '/#tiers', 302);

  const html = await getStore('program').get(PROGRAM_KEY, { type: 'text' });
  if (!html) return new Response('Program not available. Please contact support.', { status: 404 });

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  });
};
