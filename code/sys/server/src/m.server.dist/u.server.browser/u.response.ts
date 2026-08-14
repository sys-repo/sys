import type { t } from './common.ts';

/** Apply the fixed browser policy to one success or error response. */
export function applyBrowserHeaders(
  response: Response,
  policy: t.DistServer.BrowserPolicy.Headers,
): Response {
  const headers = new Headers(response.headers);
  for (const name of [...headers.keys()]) {
    if (name.toLowerCase().startsWith('access-control-')) headers.delete(name);
  }
  headers.delete('set-cookie');
  headers.set('cache-control', policy.cacheControl);
  headers.set('content-security-policy', policy.contentSecurityPolicy);
  headers.set('cross-origin-opener-policy', policy.crossOriginOpenerPolicy);
  headers.set('cross-origin-resource-policy', policy.crossOriginResourcePolicy);
  headers.set('referrer-policy', policy.referrerPolicy);
  headers.set('x-content-type-options', policy.xContentTypeOptions);
  headers.set('x-frame-options', policy.xFrameOptions);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Emit one bodyless policy rejection with the complete fixed response policy. */
export function browserRejected(
  status: number,
  policy: t.DistServer.BrowserPolicy.Headers,
): Response {
  return applyBrowserHeaders(new Response(null, { status }), policy);
}
