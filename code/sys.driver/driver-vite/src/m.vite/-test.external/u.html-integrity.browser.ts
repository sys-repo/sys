import { expect, Json, Testing } from '../../-test.ts';
import { expectedSri, type IntegrityAsset } from './u.html-integrity.fixture.ts';

export const ALTERED_JS = 'globalThis.integrityEntry = "tampered";';
export const ALTERED_CSS = '#probe { color: rgb(65, 43, 21); }';
export const ORIGINAL_COLOR = 'rgb(12, 34, 56)';
export const ALTERED_COLOR = 'rgb(65, 43, 21)';
export const UNSTYLED_COLOR = 'rgb(0, 0, 0)';

/** Only transport is shared: each spec owns its page, reporter, and observations. */
export function proofShell<Proof>(html: () => string) {
  const reports: Proof[] = [];
  const server = Testing.Http.server(async (request) => {
    const path = new URL(request.url).pathname;
    if (path === '/favicon.ico') return new Response(null, { status: 204 });
    if (path === '/proof' && request.method === 'POST') {
      const parsed = Json.safeParse<Proof>(await request.text());
      if (!parsed.ok || !parsed.data) throw new Error('invalid trusted reporter payload');
      reports.push(parsed.data);
      return new Response(null, { status: 204 });
    }
    if (path !== '/') return new Response(null, { status: 404 });
    return new Response(html(), {
      headers: { 'content-type': 'text/html', 'cache-control': 'no-store' },
    });
  });
  return {
    url: server.url.raw,
    dispose: () => server.dispose(),
    reset() {
      reports.length = 0;
    },
    report(name: string): Proof {
      expect(reports.length, `${name}: trusted reporter must finish exactly once`).to.eql(1);
      const proof = reports[0];
      if (!proof) throw new Error(`${name}: missing positive completion evidence`);
      return proof;
    },
  };
}

/** The same five CSS controls apply to select and declarative-shadow loading. */
export function cssCases(asset: IntegrityAsset) {
  return [
    {
      name: 'unprotected original',
      source: asset.source,
      digest: '',
      expected: { color: ORIGINAL_COLOR, blocked: false },
    },
    {
      name: 'unprotected altered',
      source: ALTERED_CSS,
      digest: '',
      expected: { color: ALTERED_COLOR, blocked: false },
    },
    {
      name: 'protected original',
      source: asset.source,
      digest: asset.integrity,
      expected: { color: ORIGINAL_COLOR, blocked: false },
    },
    {
      name: 'protected altered',
      source: ALTERED_CSS,
      digest: asset.integrity,
      expected: { color: UNSTYLED_COLOR, blocked: true },
    },
    {
      name: 'protected rehashed altered',
      source: ALTERED_CSS,
      digest: expectedSri(ALTERED_CSS),
      expected: { color: ALTERED_COLOR, blocked: false },
    },
  ] as const;
}

/** A controlled cross-origin asset response; individual transport-fault cases override it. */
export function assetHeaders(kind: 'js' | 'css', cached = false): Headers {
  return new Headers({
    'content-type': kind === 'js' ? 'application/javascript' : 'text/css',
    'cache-control': cached ? 'public, max-age=3600' : 'no-store',
    'access-control-allow-origin': '*',
    'x-content-type-options': 'nosniff',
  });
}

/** A rejection must identify both the resource and its cause, with no unrelated failures. */
export function expectResourceFailure(errors: readonly string[], target: string, cause: RegExp) {
  const matchingFailure = errors.some((error) => cause.test(error) && error.includes(target));
  const onlyTargetFailures = errors.every((error) => error.includes(target));
  expect(matchingFailure, errors.join('\n')).to.eql(true);
  expect(onlyTargetFailures, 'no unrelated failures').to.eql(true);
}

/** Valid transport is essential: CORS, MIME, or a 404 must not masquerade as SRI enforcement. */
export function expectIntegrityFailure(errors: readonly string[], target: string) {
  expectResourceFailure(errors, target, /integrity/i);
  const transportFailure = errors.some((error) => /CORS policy|MIME type|404/.test(error));
  expect(transportFailure, 'integrity refusal, not a transport failure').to.eql(false);
}
