// GET /program?p=<program> -> serve that paid program from Netlify Blobs.
// Access is granted by ANY of: a valid signed cookie, a permanent signed email token
// in ?t= (the magic link), or a paid Stripe session_id — AND the buyer must own THIS
// specific program (checked against the "buyers" store). Each path sets/refreshes the
// cookie in the same 200 response, which browsers store reliably (avoids the "cookie
// lost during redirect" problem on iOS Safari). No ?p= defaults to 19-39 (back-compat).
import { getStore } from '@netlify/blobs';
import { stripe, makeToken, verifyToken, parseCookies, cookie, COOKIE_NAME, getProgram, programById, ownsProgram, recordPurchase, PROGRAMS } from '../lib/paywall.mjs';

export const config = { path: '/program' };

const YEAR = 60 * 60 * 24 * 365;

async function serveProgram(blobKey, extraHeaders = {}) {
  const html = await getStore('program').get(blobKey, { type: 'text' });
  if (!html) return new Response('Program not available yet. Please contact support.', { status: 404 });
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', ...extraHeaders },
  });
}

// Re-mint the access cookie on every successful visit (sliding renewal — active
// buyers effectively never get re-gated). The cookie identifies the email; ownership
// of each program is checked per-request against the buyers store.
async function refreshHeader(email) {
  const fresh = await makeToken(process.env.COOKIE_SECRET, email || 'buyer');
  return { 'Set-Cookie': cookie(COOKIE_NAME, fresh, YEAR) };
}

export default async (req) => {
  const url = new URL(req.url);
  const id = getProgram(url.searchParams.get('p'));
  const prog = programById(id);
  const buyers = getStore('buyers');

  // 1) Returning buyer with a valid cookie — serve only if they own THIS program.
  const valid = await verifyToken(process.env.COOKIE_SECRET, parseCookies(req)[COOKIE_NAME]);
  if (valid && (await ownsProgram(buyers, valid.email, id))) {
    return serveProgram(prog.blob, await refreshHeader(valid.email));
  }

  // 2) Permanent magic link from the buyer's email (?t=) — email-bound signed token.
  const t = url.searchParams.get('t');
  if (t) {
    const v = await verifyToken(process.env.COOKIE_SECRET, t);
    if (v && (await ownsProgram(buyers, v.email, id))) {
      return serveProgram(prog.blob, await refreshHeader(v.email));
    }
  }

  // 3) Arriving straight from Stripe checkout — verify, record, serve the PURCHASED program.
  const sid = url.searchParams.get('session_id');
  if (sid) {
    try {
      const session = await stripe(process.env.STRIPE_SECRET_KEY, 'GET', `checkout/sessions/${sid}`);
      if (session.payment_status === 'paid') {
        const pid = getProgram(session.metadata?.program);
        const email = (session.customer_details?.email || '').trim().toLowerCase();
        if (email) await recordPurchase(buyers, email, pid, sid);
        return serveProgram(programById(pid).blob, await refreshHeader(email));
      }
    } catch {
      // fall through to the redirect below
    }
  }

  // 4) No valid access for this program -> its sales page (or all programs if ambiguous).
  const dest = PROGRAMS[url.searchParams.get('p')] ? prog.sales : '/#tiers';
  return Response.redirect(url.origin + dest, 302);
};
