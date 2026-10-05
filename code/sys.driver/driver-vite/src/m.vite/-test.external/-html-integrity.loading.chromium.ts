import { Browser, describe, expect, it, Json, Str, Testing } from '../../-test.ts';
import {
  ALTERED_COLOR,
  ALTERED_CSS,
  ALTERED_JS,
  assetHeaders,
  expectIntegrityFailure,
  expectResourceFailure,
  ORIGINAL_COLOR,
  proofShell,
  UNSTYLED_COLOR,
} from './u.html-integrity.browser.ts';
import {
  buildIntegrityFixture,
  expectedSri,
  type IntegrityFixture,
} from './u.html-integrity.fixture.ts';

type Loading = 'normal' | 'preload' | 'unprotected-preload' | 'cache';
type Stimulus = {
  readonly tamper?: 'js' | 'css';
  readonly rehash?: boolean;
  readonly fault?: 'cors' | 'mime' | 'missing';
  readonly loading?: Loading;
};
type Scenario = {
  readonly name: string;
  readonly input: Stimulus;
  readonly expected: {
    readonly marker: 'original' | 'tampered' | null;
    readonly color: string;
    readonly styleDigest?: 'altered';
    readonly failure?: {
      readonly asset: 'js' | 'css';
      readonly cause: 'integrity' | 'cors' | 'mime' | 'missing';
    };
  };
};
type Proof = {
  readonly marker: string | null;
  readonly before: string | null;
  readonly color: string;
  readonly styleIntegrity: string;
  readonly styleSlash: string | null;
  readonly cacheStatus: number | null;
  readonly fatal: string | null;
  readonly events: readonly {
    readonly event: string;
    readonly tag: string;
    readonly url: string;
  }[];
};

// Expected observations are specified independently of the code that applies each stimulus.
const CASES: readonly Scenario[] = [
  {
    name: 'original',
    input: {},
    expected: { marker: 'original', color: ORIGINAL_COLOR },
  },
  {
    name: 'altered JS',
    input: { tamper: 'js' },
    expected: {
      marker: null,
      color: ORIGINAL_COLOR,
      failure: { asset: 'js', cause: 'integrity' },
    },
  },
  {
    name: 'altered JS with matching digest',
    input: { tamper: 'js', rehash: true },
    expected: { marker: 'tampered', color: ORIGINAL_COLOR },
  },
  {
    name: 'altered CSS',
    input: { tamper: 'css' },
    expected: {
      marker: 'original',
      color: UNSTYLED_COLOR,
      failure: { asset: 'css', cause: 'integrity' },
    },
  },
  {
    name: 'altered CSS with matching digest',
    input: { tamper: 'css', rehash: true },
    expected: { marker: 'original', color: ALTERED_COLOR, styleDigest: 'altered' },
  },
  {
    name: 'CORS control',
    input: { fault: 'cors' },
    expected: {
      marker: null,
      color: ORIGINAL_COLOR,
      failure: { asset: 'js', cause: 'cors' },
    },
  },
  {
    name: 'MIME control',
    input: { fault: 'mime' },
    expected: {
      marker: null,
      color: ORIGINAL_COLOR,
      failure: { asset: 'js', cause: 'mime' },
    },
  },
  {
    name: 'missing-resource control',
    input: { fault: 'missing' },
    expected: {
      marker: null,
      color: ORIGINAL_COLOR,
      failure: { asset: 'js', cause: 'missing' },
    },
  },
  {
    name: 'protected preload → delayed entry refusal',
    input: { tamper: 'js', loading: 'preload' },
    expected: {
      marker: null,
      color: ORIGINAL_COLOR,
      failure: { asset: 'js', cause: 'integrity' },
    },
  },
  {
    name: 'unprotected preload → module-map counterexample',
    input: { tamper: 'js', loading: 'unprotected-preload' },
    expected: { marker: 'tampered', color: ORIGINAL_COLOR },
  },
  {
    name: 'HTTP cache → digest still enforced',
    input: { tamper: 'js', loading: 'cache' },
    expected: {
      marker: null,
      color: ORIGINAL_COLOR,
      failure: { asset: 'js', cause: 'integrity' },
    },
  },
  {
    name: 'HTTP cache → matching digest accepted',
    input: { tamper: 'js', loading: 'cache', rehash: true },
    expected: { marker: 'tampered', color: ORIGINAL_COLOR },
  },
];

const TRANSPORT_ERRORS = { cors: /CORS/i, mime: /MIME/i, missing: /404/ };

describe('HTML integrity → Chromium loading and enforcement', () => {
  it('separates SRI, transport, HTTP cache, and the document module map', async () => {
    await using cleanup = new AsyncDisposableStack();
    const state: { fixture?: IntegrityFixture } = {};
    let input: Stimulus = {};
    let page = '';
    const requests: { url: string; method: string }[] = [];
    const assets = Testing.Http.server((request) => {
      const url = new URL(request.url).href;
      requests.push({ url, method: request.method });
      const fixture = state.fixture;
      const js = url === fixture?.js.url;
      const css = url === fixture?.css.url;
      if (!fixture || (!js && !css)) return new Response(null, { status: 404 });
      const headers = assetHeaders(js ? 'js' : 'css', input.loading === 'cache');
      if (js && input.fault === 'cors') headers.delete('access-control-allow-origin');
      if (js && input.fault === 'mime') headers.set('content-type', 'text/plain');
      const original = js ? fixture.js.source : fixture.css.source;
      const altered = js ? ALTERED_JS : ALTERED_CSS;
      const tampered = input.tamper === (js ? 'js' : 'css');
      return new Response(tampered ? altered : original, {
        headers,
        status: js && input.fault === 'missing' ? 404 : 200,
      });
    });
    cleanup.defer(() => assets.dispose());
    const shell = proofShell<Proof>(() => page);
    cleanup.defer(() => shell.dispose());
    const base = new URL('/release/', assets.url.raw).href;
    const built = await buildIntegrityFixture(base);
    state.fixture = built;
    cleanup.defer(() => built.dispose());
    expect(new URL(shell.url).origin).not.to.eql(new URL(base).origin);

    for (const scenario of CASES) {
      const { name, expected } = scenario;
      input = scenario.input;
      page = proofHtml(built, input);
      requests.length = 0;
      shell.reset();
      const result = await Browser.load(shell.url, { waitAfterLoad: 1_000 });
      const proof = shell.report(name);
      const styleDigest = expected.styleDigest === 'altered'
        ? expectedSri(ALTERED_CSS)
        : built.css.integrity;
      expect(proof.fatal, name).to.eql(null);
      expect(proof.styleSlash, 'the unquoted slash remains attribute data').to.eql('/');
      expect(proof.styleIntegrity, 'browser-effective stylesheet integrity').to.eql(styleDigest);
      expect(proof.marker, name).to.eql(expected.marker);
      expect(proof.color, name).to.eql(expected.color);
      expect(result.ok, `${name}: ${result.errors.join('\n')}`).to.eql(!expected.failure);
      expect(requests.every((req) => req.method === 'GET'), 'no preflights').to.eql(true);
      expect(requests.some((req) => req.url === built.js.url), name).to.eql(true);
      expect(requests.some((req) => req.url === built.css.url), name).to.eql(true);

      if (expected.failure) {
        const { asset, cause } = expected.failure;
        const target = built[asset].url;
        const observedError = proof.events.some((event) =>
          event.event === 'error' && event.url === target
        );
        expect(observedError, name).to.eql(true);
        if (cause === 'integrity') expectIntegrityFailure(result.errors, target);
        else expectResourceFailure(result.errors, target, TRANSPORT_ERRORS[cause]);
      }
      if (input.loading) expect(proof.before, 'preload/fetch does not execute').to.eql(null);
      if (input.loading === 'cache') {
        const jsRequests = requests.filter((req) => req.url === built.js.url);
        expect(proof.cacheStatus).to.eql(200);
        expect(jsRequests.length, 'the module consumes cached bytes').to.eql(1);
      }
      console.info('SRI browser proof:', name);
    }
  });
});

/** Mutate only the controlled stimulus; expected observations never drive the page or server. */
function proofHtml(fixture: IntegrityFixture, input: Stimulus): string {
  const loading = input.loading ?? 'normal';
  let html = fixture.html;
  let integrity = fixture.js.integrity;
  if (input.rehash) {
    const asset = input.tamper === 'js' ? fixture.js : fixture.css;
    const next = expectedSri(input.tamper === 'js' ? ALTERED_JS : ALTERED_CSS);
    html = html.replaceAll(asset.integrity, next);
    if (input.tamper === 'js') integrity = next;
  }
  if (loading !== 'normal') {
    html = html.replace(/<script\b[^>]*type="module"[^>]*>[\s\S]*?<\/script>/g, '');
  }
  if (loading === 'cache') html = html.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g, '');
  if (loading === 'unprotected-preload') {
    html = html.replace(
      /<link\b[^>]*rel="modulepreload"[^>]*>/g,
      (tag) => tag.replace(/ integrity="[^"]*"/, ''),
    );
  }
  const reporter = loadingReporter({ loading, src: fixture.js.url, integrity });
  return html.replace('<head>', `<head>${reporter}`);
}

/** Trusted shell code observes loading; it is never one of the resources under test. */
function loadingReporter(input: { loading: Loading; src: string; integrity: string }): string {
  return Str.dedent(`
    <script>
      (() => {
        const input = ${Json.stringify(input)};
        const events = [];
        let preloadDone;
        const preloaded = new Promise((resolve) => { preloadDone = resolve; });
        for (const event of ['load', 'error']) {
          document.addEventListener(event, (e) => {
            const target = e.target;
            if (!(target instanceof HTMLScriptElement || target instanceof HTMLLinkElement)) return;
            const url = target.src || target.href;
            events.push({ event, tag: target.tagName, url });
            if (target.rel === 'modulepreload' && url === input.src) preloadDone();
          }, true);
        }
        window.addEventListener('load', async () => {
          let fatal = null;
          let before = null;
          let cacheStatus = null;
          try {
            if (input.loading === 'cache') {
              const response = await fetch(input.src, { mode: 'cors', cache: 'force-cache' });
              cacheStatus = response.status;
              await response.arrayBuffer();
              if (!response.ok) throw new Error('cache warm-up failed');
            } else if (input.loading !== 'normal') {
              await preloaded;
            }
            if (input.loading !== 'normal') {
              before = globalThis.integrityEntry ?? null;
              const script = document.createElement('script');
              script.type = 'module';
              script.src = input.src;
              script.integrity = input.integrity;
              script.crossOrigin = 'anonymous';
              const settled = new Promise((resolve) => {
                script.onload = resolve;
                script.onerror = resolve;
              });
              document.head.append(script);
              await settled;
            }
          } catch (error) {
            fatal = String(error);
          }
          const style = document.querySelector('link[rel="stylesheet"]');
          const data = {
            marker: globalThis.integrityEntry ?? null,
            before,
            styleIntegrity: style.integrity,
            styleSlash: style.getAttribute('data-x'),
            color: getComputedStyle(document.getElementById('probe')).color,
            cacheStatus,
            fatal,
            events,
          };
          await fetch('/proof', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(data),
          });
        }, { once: true });
      })();
    </script>
  `);
}
