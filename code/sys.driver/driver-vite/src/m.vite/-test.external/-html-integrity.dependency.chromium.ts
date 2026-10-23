import { createRequire } from 'node:module';
import { build, version } from 'vite';
import { Browser, describe, expect, Fs, Hash, it, Json, Str, Testing } from '../../-test.ts';
import { Vite } from '../mod.ts';
import { attestIntegrity } from './u.html-integrity.attest.ts';
import { assetHeaders, expectIntegrityFailure, proofShell } from './u.html-integrity.browser.ts';

type Asset = { readonly url: string; readonly source: string; readonly integrity: string };
type Fixture = {
  readonly html: string;
  readonly entry: Asset;
  readonly dependency: Asset;
  dispose(): Promise<void>;
};
type Proof = {
  readonly ua: string;
  readonly marker: string | null;
  readonly entry: number | null;
  readonly fatal: string | null;
  readonly events: readonly string[];
};

const ORIGINAL = 'original-dependency';
const ALTERED = 'tampered-dependency';

// Byte/hash controls are independent of the code applying them to HTTP responses and HTML.
const CASES = [
  { name: 'original', tamper: false, rehash: false, marker: ORIGINAL },
  { name: 'tampered', tamper: true, rehash: false, marker: null },
  { name: 'rehashed', tamper: true, rehash: true, marker: ALTERED },
] as const;

describe('Dependency modulepreload SRI → ordinary static import', () => {
  it('original / tampered / rehashed → normal and preload-settled response schedules', async () => {
    await using cleanup = new AsyncDisposableStack();
    const state: { fixture?: Fixture } = {};
    let input = { held: false, tamper: false };
    let gate = Promise.withResolvers<void>();
    const timeline: string[] = [];
    const requests: string[] = [];
    const assets = Testing.Http.server(async (request) => {
      const url = new URL(request.url);
      requests.push(`${request.method} ${url.href}`);
      if (url.pathname === '/settled') {
        const event = url.searchParams.get('event');
        if (event !== 'load' && event !== 'error') throw new Error('Invalid preload event.');
        timeline.push(`settled:${event}`);
        gate.resolve();
        return new Response(null, { status: 204, headers: assetHeaders('js') });
      }
      const fixture = state.fixture;
      if (!fixture) return new Response(null, { status: 404 });
      if (url.href === fixture.entry.url) {
        timeline.push('entry:requested');
        if (input.held) {
          const timeout = setTimeout(
            () => gate.reject(new Error('Preload did not settle.')),
            5_000,
          );
          try {
            await gate.promise;
          } finally {
            clearTimeout(timeout);
          }
        }
        timeline.push('entry:released');
        return new Response(fixture.entry.source, { headers: assetHeaders('js') });
      }
      if (url.href === fixture.dependency.url) {
        timeline.push('dependency:response');
        const source = input.tamper
          ? fixture.dependency.source.replaceAll(ORIGINAL, ALTERED)
          : fixture.dependency.source;
        return new Response(source, { headers: assetHeaders('js') });
      }
      return new Response(null, { status: 404 });
    });
    cleanup.defer(() => assets.dispose());
    let page = '';
    const shell = proofShell<Proof>(() => page);
    cleanup.defer(() => shell.dispose());
    const fixture = await buildFixture(new URL('/release/', assets.url.raw).href);
    state.fixture = fixture;
    cleanup.defer(fixture.dispose);
    expect(new URL(shell.url).origin).not.to.eql(new URL(fixture.entry.url).origin);
    const changed = fixture.dependency.source.replaceAll(ORIGINAL, ALTERED);
    expect(changed).not.to.eql(fixture.dependency.source);
    const failures: string[] = [];

    for (const held of [false, true]) {
      for (const scenario of CASES) {
        const name = `${held ? 'preload settled before import' : 'ordinary'}: ${scenario.name}`;
        input = { held, tamper: scenario.tamper };
        gate = Promise.withResolvers<void>();
        timeline.length = 0;
        requests.length = 0;
        shell.reset();
        const html = scenario.rehash
          ? fixture.html.replace(
            fixture.dependency.integrity,
            Hash.sha256(changed, { encoding: 'base64' }),
          )
          : fixture.html;
        page = html.replace(
          '<head>',
          `<head>${reporter(fixture.dependency.url, assets.url.raw, held)}`,
        );
        try {
          const result = await Browser.load(shell.url, { waitAfterLoad: 750 });
          const proof = shell.report(name);
          console.info(
            'Dependency SRI proof:',
            Json.stringify({ name, proof, timeline, requests, errors: result.errors }),
          );
          expect(proof.fatal, name).to.eql(null);
          if (held) {
            const settled = timeline.indexOf(
              `settled:${scenario.tamper && !scenario.rehash ? 'error' : 'load'}`,
            );
            expect(settled, 'browser-confirmed preload settlement').to.be.greaterThan(-1);
            expect(timeline.indexOf('entry:released'), 'settlement precedes ordinary entry release')
              .to.be.greaterThan(settled);
          }
          if (scenario.tamper && !scenario.rehash) {
            expectIntegrityFailure(result.errors, fixture.dependency.url);
            if (proof.marker !== scenario.marker) {
              failures.push(
                `${name}: altered dependency executed (${proof.marker}); dependency requests=${
                  requests.filter((request) => request.endsWith(fixture.dependency.url)).length
                }`,
              );
            }
          } else {
            expect(result.ok, result.errors.join('\n')).to.eql(true);
            expect(proof.marker, name).to.eql(scenario.marker);
            expect(proof.entry, name).to.eql(7);
          }
        } finally {
          gate.resolve();
        }
      }
    }
    expect(failures, 'altered dependency must not execute in either schedule').to.eql([]);
  });
});

/** Native Vite build with managed app integrity; no manufactured HTML preload or entry delay. */
async function buildFixture(base: string): Promise<Fixture> {
  const root = (await Fs.makeTempDir({ prefix: 'vite.integrity.dependency.' })).absolute;
  const dispose = async () => void await Fs.remove(root);
  try {
    await Fs.write(
      Fs.join(root, 'index.html'),
      Str.dedent(`
        <!doctype html><html><head><title>Dependency SRI</title></head><body>
          <script type="module" src="./main.js"></script>
        </body></html>
      `),
      { throw: true },
    );
    await Fs.write(
      Fs.join(root, 'main.js'),
      Str.dedent(`
        import { value } from './dependency.js';
        globalThis.integrityEntry = value;
      `),
      { throw: true },
    );
    await Fs.write(
      Fs.join(root, 'dependency.js'),
      Str.dedent(`
        globalThis.integrityDependency = '${ORIGINAL}';
        export const value = 7;
      `),
      { throw: true },
    );
    const paths = Vite.Config.paths({ cwd: root, app: { entry: './index.html', base } });
    const config = await Vite.Config.app({
      paths,
      workspace: false,
      plugins: { react: false, deno: false, wasm: false, optimizeImports: false },
    });
    await build({
      ...config,
      configFile: false,
      logLevel: 'silent',
      css: { postcss: { plugins: [] } },
      build: {
        ...config.build,
        rollupOptions: {
          input: Fs.join(root, 'index.html'),
          output: {
            format: 'es',
            manualChunks: (id) => id.endsWith('/dependency.js') ? 'dependency' : undefined,
          },
        },
      },
    });
    const dir = Fs.join(root, 'dist');
    const product = await attestIntegrity(dir, base);
    console.info('Dependency SRI written inventory:', Json.stringify(product.references));
    const entries = product.references.filter((ref) => ref.kind === 'module');
    const preloads = product.references.filter((ref) => ref.kind === 'modulepreload');
    expect(entries.length, 'real emitted module entry').to.eql(1);
    expect(preloads.length, 'real emitted dependency preload').to.eql(1);
    const read = async (ref: typeof entries[number]): Promise<Asset> => {
      const source = (await Fs.readText(Fs.join(dir, ref.path))).data;
      if (source === undefined) throw new Error(`Missing emitted chunk ${ref.path}`);
      return { url: new URL(ref.url, base).href, source, integrity: ref.digest };
    };
    const entry = await read(entries[0]);
    const dependency = await read(preloads[0]);
    expect(dependency.url).not.to.eql(entry.url);
    expect(entry.source).to.match(/\bimport\b/);
    expect(entry.source).to.include(new URL(dependency.url).pathname.split('/').at(-1));
    expect(dependency.source).to.include(ORIGINAL);
    expect(product.html.indexOf('<script type="module"')).to.be.lessThan(
      product.html.indexOf('<link rel="modulepreload"'),
    );
    const require = createRequire(import.meta.url);
    const vitePath = require.resolve('vite/package.json');
    const rolldownPath = createRequire(vitePath).resolve('rolldown/package.json');
    const rolldown = (await Fs.readJson<{ version: string }>(rolldownPath)).data;
    if (!rolldown) throw new Error('Missing Rolldown identity.');
    console.info(
      'Dependency SRI toolchain:',
      Json.stringify({ deno: Deno.version.deno, vite: version, rolldown: rolldown.version }),
    );
    return { html: product.html, entry, dependency, dispose };
  } catch (error) {
    await dispose();
    throw error;
  }
}

/** Independent trusted observer: observes preload events and releases only a held HTTP response. */
function reporter(dependency: string, origin: string, held: boolean): string {
  return Str.dedent(`
    <script>
      (() => {
        const input = ${Json.stringify({ dependency, origin, held })};
        const events = [];
        let settlement = Promise.resolve();
        for (const event of ['load', 'error']) {
          document.addEventListener(event, e => {
            if (e.target?.rel !== 'modulepreload' || e.target.href !== input.dependency) return;
            events.push(event);
            if (!input.held) return;
            settlement = (async () => {
              const url = new URL('/settled', input.origin);
              url.searchParams.set('event', event);
              const response = await fetch(url);
              if (!response.ok) throw new Error('Preload settlement handshake failed.');
            })();
          }, true);
        }
        window.addEventListener('load', async () => {
          let fatal = null;
          try { await settlement; } catch (error) { fatal = String(error); }
          await fetch('/proof', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ua: navigator.userAgent,
              marker: globalThis.integrityDependency ?? null,
              entry: globalThis.integrityEntry ?? null, fatal, events }),
          });
        }, { once: true });
      })();
    </script>
  `);
}
