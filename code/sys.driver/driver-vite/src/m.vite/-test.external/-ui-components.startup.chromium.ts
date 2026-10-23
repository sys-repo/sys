import { Http } from '@sys/http/client';
import {
  Browser,
  describe,
  expect,
  Fs,
  Is,
  it,
  Json,
  ROOT,
  Str,
  type t,
  Testing,
} from '../../-test.ts';

/** Run after ui-components' declared build task; never rebuild or mutate its sources here. */
describe('UI components → production startup browser proof', () => {
  it('cold routes, spec selection, keyboard and separate service-worker lifecycle', async () => {
    const dir = ROOT.resolve('code/sys.ui/ui-components/dist');
    const { data: dist } = await Fs.readJson<t.DistPkg>(Fs.join(dir, 'dist.json'));
    if (!dist?.pkg) throw new Error('Run ui-components: deno task build first');
    const assets = new Map<string, Uint8Array<ArrayBuffer>>();
    for (const file of [...Object.keys(dist.hash.parts), 'dist.json']) {
      const { data } = await Fs.read(Fs.join(dir, file));
      if (!data) throw new Error(`Missing built asset: ${file}`);
      assets.set(`/${file}`, Uint8Array.from(data));
    }
    const html = new TextDecoder().decode(assets.get('/index.html'));
    const observer = PROBE.replace('__EXPECTED_PKG__', Json.stringify(dist.pkg));
    expect(html).to.include('integrity="sha256-');
    const reports: Record<string, unknown>[] = [];
    const requests: string[] = [];
    const cacheRequests: { phase: string; path: string }[] = [];
    let cachePhase = '';
    const server = Testing.Http.server(async (request) => {
      const url = new URL(request.url);
      cachePhase = url.searchParams.get('sw-proof') ?? cachePhase;
      if (url.pathname === '/proof' && request.method === 'POST') {
        const report = await request.json();
        if (!Is.record(report)) return new Response(null, { status: 400 });
        reports.push(report);
        return new Response(null, { status: 204 });
      }
      if (url.pathname === '/favicon.ico') return new Response(null, { status: 204 });
      requests.push(url.pathname);
      if (cachePhase) cacheRequests.push({ phase: cachePhase, path: url.pathname });
      const path = url.pathname === '/' ? '/index.html' : url.pathname;
      const bytes = assets.get(path);
      if (!bytes) return new Response(null, { status: 404 });
      const type = contentType(path);
      // Diagnostic observer only: preserve all built script/preload bytes and integrity attributes.
      const body = path === '/index.html' ? html.replace('<head>', `<head>${observer}`) : bytes;
      return new Response(body, { headers: { 'content-type': type, 'cache-control': 'no-store' } });
    });
    try {
      for (const route of ['/', '/?dev', '/?dev&select=Button', '/?dev&select=Prose.Markdown']) {
        reports.length = 0;
        requests.length = 0;
        // Each load owns a fresh Chrome profile: no inherited HTTP cache, SW or local storage.
        const url = new URL(route, server.url.raw).href;
        const result = await Browser.load(url, { waitAfterLoad: 5_000 });
        expect(result.ok, result.errors.join('\n')).to.eql(true);
        const report = reports.at(-1);
        expect(report, `missing browser report: ${route}`).not.to.eql(undefined);
        if (!report) throw new Error(`Missing browser report: ${route}`);
        expect(report.error, Json.stringify(report)).to.eql(null);
        expect(report.title).to.eql(dist.pkg.name);
        expect(report.keyboardConsumed).to.eql(true);
        expect(report.ready).to.eql(true);
        if (route.includes('select=')) expect(report.selectedFromIndex).to.eql(true);
        else expect(report.metadata).to.eql(true);
        if (route === '/?dev') expect(requests).to.include('/dist.json');
        const evidence = { route, digest: dist.hash.digest, report };
        console.info('Current consumer browser proof:', evidence);
      }
      // Separate fresh run: service-worker activation/control/cache is not counted as route speedup.
      const url = new URL('/', server.url.raw).href;
      const sw = new URL('/sw.js', url).href;
      const cache = Http.Cache.Pkg.names(dist.pkg).asset;
      const lifecycle = await Browser.ServiceWorker.scenario({
        steps: [
          { kind: 'navigate', url },
          { kind: 'observe', expect: { kind: 'registrations', count: 1 } },
          { kind: 'observe', expect: { kind: 'controller', state: 'present', scriptURL: sw } },
          // This helper uses Page.reload({ ignoreCache: true }): explicitly a hard reload.
          { kind: 'reload' },
          { kind: 'observe', expect: { kind: 'controller', state: 'absent' } },
          { kind: 'navigate', url: `${url}?sw-proof=warm` },
          { kind: 'observe', expect: { kind: 'controller', state: 'present', scriptURL: sw } },
          { kind: 'observe', expect: { kind: 'cache', name: cache, state: 'present' } },
          { kind: 'navigate', url: `${url}?sw-proof=hit` },
          { kind: 'observe', expect: { kind: 'controller', state: 'present', scriptURL: sw } },
        ],
        settle: 500,
      });
      expect(lifecycle.ok, Json.stringify(lifecycle)).to.eql(true);
      const warm = cacheRequests.filter((item) => item.phase === 'warm');
      const hit = cacheRequests.filter((item) => item.phase === 'hit');
      expect(warm.some((item) => item.path.startsWith('/pkg/'))).to.eql(true);
      expect(hit.some((item) => item.path === '/')).to.eql(true);
      expect(hit.filter((item) => item.path.startsWith('/pkg/'))).to.eql([]);
      console.info('Current consumer SW lifecycle:', { lifecycle, warm, hit });
    } finally {
      await server.dispose();
    }
  });
});

/** Content types for the built assets served by this proof. */
function contentType(path: string) {
  if (path.endsWith('.js')) return 'text/javascript';
  if (path.endsWith('.html')) return 'text/html';
  if (path.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}

/** Observe rendered readiness, then exercise the real index link and keyboard handler. */
const PROBE = Str.dedent(`
  <script>
    window.addEventListener('load', async () => {
      const report = { error: null, ready: false, title: '', metadata: false, keyboardConsumed: false };
      try {
        const expected = __EXPECTED_PKG__;
        const query = new URL(location.href).searchParams;
        const select = query.get('select');
        const text = () => document.body.innerText;
        const isIndex = () => text().includes('Prose.Markdown') && text().includes('Buttons.Switch');
        const wait = async (predicate) => {
          const deadline = performance.now() + 3500;
          while (!predicate()) {
            if (performance.now() > deadline) {
              const excerpt = text().slice(0, 500);
              throw new Error('UI readiness timed out: ' + excerpt);
            }
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        };
        if (select && !sessionStorage.getItem('selected-from-index')) {
          await wait(isIndex);
          const links = [...document.querySelectorAll('li a')];
          const link = links.find((el) => {
            const label = el.textContent.trim();
            return label === select || label.endsWith(': ' + select);
          });
          if (!link) throw new Error('Missing index selection: ' + select);
          sessionStorage.setItem('selected-from-index', 'true');
          link.click();
          return;
        }
        if (select) {
          const marker = select === 'Button' ? 'Hello Button' : 'This sample renders';
          await wait(() => text().includes(marker));
        } else if (query.has('dev')) {
          await wait(isIndex);
        } else {
          await wait(() => text().includes('@sys/ui-components') && text().includes('version'));
        }
        const key = { key: 's', code: 'KeyS', metaKey: true, bubbles: true };
        const down = new KeyboardEvent('keydown', { ...key, cancelable: true });
        const up = new KeyboardEvent('keyup', key);
        document.body.dispatchEvent(down);
        document.body.dispatchEvent(up);
        report.keyboardConsumed = down.defaultPrevented;
        report.ready = true;
        report.title = document.title;
        report.metadata = text().includes(expected.name) && text().includes(expected.version);
        report.selectedFromIndex = sessionStorage.getItem('selected-from-index') === 'true';
        report.href = location.href;
        report.readinessMs = performance.now();
        report.resources = performance.getEntriesByType('resource').map((item) => ({
          path: new URL(item.name).pathname, initiator: item.initiatorType,
          encodedBytes: item.encodedBodySize, decodedBytes: item.decodedBodySize,
        }));
      } catch (error) {
        report.error = String(error);
      }
      await fetch('/proof', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(report),
      });
    }, { once: true });
  </script>
`);
