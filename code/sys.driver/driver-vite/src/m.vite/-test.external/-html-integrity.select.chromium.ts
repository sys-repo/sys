import { Browser, describe, expect, it, Str, Testing } from '../../-test.ts';
import {
  assetHeaders,
  cssCases,
  expectIntegrityFailure,
  proofShell,
} from './u.html-integrity.browser.ts';
import { buildSelectIntegrityFixture } from './u.html-integrity.fixture.ts';

type Proof = {
  readonly color: string;
  readonly url: string | null;
  readonly integrity: string | null;
  readonly inSelect: boolean;
  readonly userAgent: string;
  readonly errors: readonly string[];
};

describe('HTML integrity → Chromium select boundary', () => {
  it('proves active CSS and browser enforcement before checking build refusal', async () => {
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
    const fixture = await buildSelectIntegrityFixture(base);
    cleanup.defer(() => fixture.dispose());
    target = fixture.css.url;
    expect(new URL(shell.url).origin).not.to.eql(new URL(base).origin);
    const cases = cssCases(fixture.css);
    const reporter = selectReporter();

    for (const next of cases) {
      bytes = next.source;
      const html = next.digest
        ? fixture.html.replace(
          'id="select-style"',
          `id="select-style" integrity="${next.digest}" crossorigin="anonymous"`,
        )
        : fixture.html;
      page = html.replace('<head>', `<head>${reporter}`);
      requests.length = 0;
      shell.reset();
      const result = await Browser.load(shell.url, { waitAfterLoad: 1_000 });
      const proof = shell.report(next.name);
      const { blocked, color } = next.expected;
      const expectedErrors = blocked ? [fixture.css.url] : [];
      expect(proof.url).to.eql(fixture.css.url);
      expect(proof.inSelect, 'the browser retained the link inside SELECT').to.eql(true);
      expect(proof.integrity).to.eql(next.digest);
      expect(proof.color, next.name).to.eql(color);
      expect(requests).to.eql([{ url: fixture.css.url, method: 'GET' }]);
      expect(result.ok, result.errors.join('\n')).to.eql(!blocked);
      expect(proof.errors).to.eql(expectedErrors);
      if (blocked) {
        expectIntegrityFailure(result.errors, fixture.css.url);
        console.info('SRI select refusal:', result.errors.join('\n'));
      }
      if (next === cases[0]) console.info('SRI browser:', proof.userAgent);
      console.info('SRI select proof:', next.name);
    }

    // Keep this last: a successful enabled build must not prevent observation of the bypass.
    const reason = fixture.refusal;
    if (!reason) throw new Error('enabled build must refuse the parser/browser mismatch');
    expect(reason).to.include('[sys:html-integrity]');
    expect(reason).to.include('static <select>');
  });
});

/** Observe the browser's actual link placement, not the server-side parser's tree. */
function selectReporter(): string {
  return Str.dedent(`
    <script>
      const errors = [];
      document.addEventListener('error', (event) => {
        if (event.target instanceof HTMLLinkElement) errors.push(event.target.href);
      }, true);
      window.addEventListener('load', async () => {
        const link = document.getElementById('select-style');
        const data = {
          color: getComputedStyle(document.getElementById('probe')).color,
          url: link?.href ?? null,
          integrity: link?.integrity ?? null,
          inSelect: link?.parentElement?.tagName === 'SELECT',
          userAgent: navigator.userAgent,
          errors,
        };
        await fetch('/proof', { method: 'POST', body: JSON.stringify(data) });
      }, { once: true });
    </script>
  `);
}
