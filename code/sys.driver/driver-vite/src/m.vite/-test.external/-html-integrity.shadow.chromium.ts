import { Browser, describe, expect, it, Str, Testing } from '../../-test.ts';
import {
  assetHeaders,
  cssCases,
  expectIntegrityFailure,
  proofShell,
} from './u.html-integrity.browser.ts';
import { buildShadowIntegrityFixture, type ShadowBoundary } from './u.html-integrity.fixture.ts';

type Proof = {
  readonly color: string | null;
  readonly url: string | null;
  readonly integrity: string | null;
  readonly modes: readonly string[];
  readonly userAgent: string;
  readonly fatal: string | null;
};

const BOUNDARIES: readonly ShadowBoundary[] = [
  { mode: 'open' },
  { mode: 'closed' },
  { outerMode: 'open', mode: 'closed' },
  { outerMode: 'closed', mode: 'open' },
];

describe('HTML integrity → Chromium declarative-shadow boundary', () => {
  for (const boundary of BOUNDARIES) {
    const name = boundary.outerMode ? `${boundary.outerMode} → ${boundary.mode}` : boundary.mode;
    it(`proves active CSS and browser enforcement before checking build refusal: ${name}`, async () => {
      await using cleanup = new AsyncDisposableStack();
      let page = '';
      let bytes = '';
      let target = '';
      const requests: { url: string; method: string }[] = [];
      const assets = Testing.Http.server((request) => {
        requests.push({ url: request.url, method: request.method });
        if (request.url !== target) return new Response(null, { status: 404 });
        return new Response(bytes, { headers: assetHeaders('css') });
      });
      cleanup.defer(() => assets.dispose());
      const shell = proofShell<Proof>(() => page);
      cleanup.defer(() => shell.dispose());
      const base = new URL('/release/', assets.url.raw).href;
      const fixture = await buildShadowIntegrityFixture(base, boundary);
      cleanup.defer(() => fixture.dispose());
      target = fixture.css.url;
      expect(new URL(shell.url).origin).not.to.eql(new URL(base).origin);
      const cases = cssCases(fixture.css);
      const reporter = shadowReporter(boundary);
      const expectedModes = boundary.outerMode
        ? [boundary.outerMode, boundary.mode]
        : [boundary.mode];

      for (const next of cases) {
        bytes = next.source;
        const html = next.digest
          ? fixture.html.replace(
            'id="shadow-style"',
            `id="shadow-style" integrity="${next.digest}" crossorigin="anonymous"`,
          )
          : fixture.html;
        page = html.replace('<head>', `<head>${reporter}`);
        requests.length = 0;
        shell.reset();
        const result = await Browser.load(shell.url, { waitAfterLoad: 1_000 });
        const proof = shell.report(`${name}: ${next.name}`);
        const { blocked, color } = next.expected;
        expect(proof.fatal, next.name).to.eql(null);
        expect(proof.modes).to.eql(expectedModes);
        expect(proof.url).to.eql(fixture.css.url);
        expect(proof.integrity).to.eql(next.digest);
        expect(proof.color, next.name).to.eql(color);
        expect(requests).to.eql([{ url: fixture.css.url, method: 'GET' }]);
        expect(result.ok, result.errors.join('\n')).to.eql(!blocked);
        if (blocked) {
          expectIntegrityFailure(result.errors, fixture.css.url);
          console.info('SRI shadow refusal:', result.errors.join('\n'));
        }
        if (next === cases[0]) console.info('SRI shadow browser:', proof.userAgent);
        console.info('SRI shadow proof:', name, next.name);
      }

      // Keep this last: a successful enabled build must not hide browser-active shadow CSS.
      const reason = fixture.refusal;
      if (!reason) throw new Error('enabled build must refuse active declarative shadow content');
      expect(reason).to.include('[sys:html-integrity]');
      expect(reason).to.include('declarative shadow DOM');
    });
  }
});

/** Observe existing open/closed roots through ElementInternals, without replacing them. */
function shadowReporter(boundary: ShadowBoundary): string {
  return Str.dedent(`
    <script>
      window.addEventListener('load', async () => {
        const data = {
          color: null,
          url: null,
          integrity: null,
          modes: [],
          userAgent: navigator.userAgent,
          fatal: null,
        };
        try {
          const roots = new WeakMap();
          // A class is required for custom elements. Unlike attachShadow(), this observes
          // the existing declarative root rather than clearing it during attachment.
          customElements.define('sri-host', class extends HTMLElement {
            constructor() {
              super();
              roots.set(this, this.attachInternals().shadowRoot);
            }
          });
          let root = roots.get(document.querySelector('sri-host'));
          if (!root) throw new Error('missing outer declarative root');
          data.modes.push(root.mode);
          if (${!!boundary.outerMode}) {
            root = roots.get(root.querySelector('sri-host'));
            if (!root) throw new Error('missing nested declarative root');
            data.modes.push(root.mode);
          }
          const link = root.getElementById('shadow-style');
          const probe = root.getElementById('probe');
          if (!link || !probe) throw new Error('missing shadow resource or probe');
          data.color = getComputedStyle(probe).color;
          data.url = link.href;
          data.integrity = link.integrity;
        } catch (error) {
          data.fatal = String(error);
        }
        await fetch('/proof', { method: 'POST', body: JSON.stringify(data) });
      }, { once: true });
    </script>
  `);
}
