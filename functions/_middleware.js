// The nonce must exist before Cloudflare injects JavaScript Detections.
// A response-header Transform runs too late to supply that nonce.
export const PUBLIC_CSP = "default-src 'none'; img-src 'self'; style-src 'self'; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; frame-src https://www.youtube-nocookie.com https://player.vimeo.com https://player.bilibili.com; base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'none'";

export async function onRequest(context) {
  const response = await context.next();
  if (!response.headers.get('content-type')?.toLowerCase().startsWith('text/html')) return response;
  const headers = new Headers(response.headers);
  const production = new URL(context.request.url).hostname === 'yuki.art';
  let csp = PUBLIC_CSP;
  if (production) {
    const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
    csp = csp.replace("script-src 'self'", `script-src 'self' 'nonce-${nonce}'`);
    // The asset behind next() remains cached; the final HTML nonce is never reused.
    headers.set('Cache-Control', 'private, no-cache');
    headers.delete('ETag');
  } else {
    headers.set('Cache-Control', 'no-transform');
    headers.set('X-Robots-Tag', 'noindex');
  }
  headers.set('Content-Security-Policy', csp);
  headers.set('Strict-Transport-Security', 'max-age=86400');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
