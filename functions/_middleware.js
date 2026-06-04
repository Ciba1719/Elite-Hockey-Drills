// Safety net: 404 any build artifact / data source so the paid program can't be
// reconstructed from public files, even if one gets committed by accident.
const BLOCK = [
  /^\/program\.html$/i,
  /^\/program\.pdf$/i,
  /^\/program\.data\.js$/i,
  /^\/program\.css$/i,
  /^\/build\.js$/i,
  /^\/generate\.js$/i,
  /^\/render-pdf\.js$/i,
  /^\/embed-fonts\.js$/i,
  /^\/fonts\.css$/i,
  /\.xlsx$/i,
  /^\/(BUILD_REPORT|MISSING_SLUGS)\.md$/i,
  /^\/SLUG_MAP\.csv$/i,
  /^\/package(-lock)?\.json$/i,
];

export async function onRequest({ request, next }) {
  const path = new URL(request.url).pathname;
  if (BLOCK.some((re) => re.test(path))) return new Response('Not found', { status: 404 });
  return next();
}
