import { serveFileBytes } from '@sys/http/server';
import { Browser, describe, expect, Fs, it, Json, Str, Testing } from '../../-test.ts';
import { writeLocalFixtureImports } from '../-test/u.bridge.fixture.ts';
import { Vite } from '../mod.ts';

type Phase = 'development' | 'production';
type BrowserProof = {
  readonly phase: Phase;
  readonly trace: string;
  readonly disposePreserved: boolean;
  readonly asyncDisposePreserved: boolean;
};
type ProofSignals = Record<Phase, PromiseWithResolvers<BrowserProof>>;

type BrowserLoad = (url: string) => Promise<{
  readonly ok: boolean;
  readonly executablePath?: string;
}>;

const PROOF_PATH = '/-/browser-syntax-proof';
const PROOF_TIMEOUT = 10_000;

describe('Vite browser syntax Chromium runtime', () => {
  it('runs lowered disposal in Chromium development and production', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'Vite.browser-syntax.chromium.' });
    const dir = Fs.join(tmp.absolute, 'fixture');
    const load: BrowserLoad = async (url) =>
      await Browser.load(url, {
        waitAfterLoad: 500,
        allowError: isMissingFavicon,
      });
    const proofs: ProofSignals = {
      development: Promise.withResolvers(),
      production: Promise.withResolvers(),
    };
    const receiver = startProofReceiver(proofs);
    const proofUrl = new URL(PROOF_PATH, receiver.url.raw).href;
    let restore: (() => Promise<void>) | undefined;
    let dev: Awaited<ReturnType<typeof Vite.dev>> | undefined;
    let production: ReturnType<typeof Testing.Http.server> | undefined;

    try {
      await writeFixture(dir, proofUrl);
      restore = await writeLocalFixtureImports(dir);
      const paths = Vite.Config.paths({ cwd: dir, app: { entry: './index.html' } });

      dev = await Vite.dev({ paths, port: Testing.randomPort(), silent: true });
      await runBrowserProof(
        load,
        withPhase(dev.url, 'development'),
        proofs.development,
        'development',
      );

      const build = await Vite.build({ paths, silent: true, spinner: false, exitOnError: false });
      expect(build.ok).to.eql(true);
      production = startProductionServer(Fs.join(paths.cwd, paths.app.outDir));
      await runBrowserProof(
        load,
        withPhase(production.url.raw, 'production'),
        proofs.production,
        'production',
      );
    } finally {
      if (dev) await dev.dispose();
      if (production) await production.dispose();
      await receiver.dispose();
      if (restore) await restore();
      await Fs.remove(tmp.absolute, { log: false });
    }
  });
});

function startProofReceiver(proofs: ProofSignals) {
  return Testing.Http.server((request) => {
    const url = new URL(request.url);
    const phase = url.searchParams.get('phase');
    if (url.pathname !== PROOF_PATH || !isPhase(phase)) {
      return new Response(null, { status: 404 });
    }

    proofs[phase].resolve({
      phase,
      trace: url.searchParams.get('trace') ?? '',
      disposePreserved: url.searchParams.get('disposePreserved') === 'true',
      asyncDisposePreserved: url.searchParams.get('asyncDisposePreserved') === 'true',
    });
    return new Response(null, {
      status: 204,
      headers: { 'access-control-allow-origin': '*' },
    });
  });
}

function startProductionServer(root: string) {
  const resolvedRoot = Fs.resolve(root);
  return Testing.Http.server(async (request) => {
    const pathname = decodeURIComponent(new URL(request.url).pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const path = Fs.resolve(resolvedRoot, relative);
    if (!Fs.Path.Is.within(resolvedRoot, path)) return new Response(null, { status: 404 });

    return await serveFileBytes({
      req: request,
      path,
      cache: 'no-store',
      read: async () => {
        const source = await Fs.read(path);
        return source.ok && source.data
          ? { kind: 'bytes', bytes: source.data }
          : { kind: 'missing' };
      },
    });
  });
}

async function runBrowserProof(
  load: BrowserLoad,
  url: string,
  signal: PromiseWithResolvers<BrowserProof>,
  phase: Phase,
) {
  const result = await load(url);
  expect(result.ok).to.eql(true);
  expect(result.executablePath).to.be.a('string');
  await expectProof(signal, phase);
}

async function expectProof(signal: PromiseWithResolvers<BrowserProof>, phase: Phase) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Browser syntax proof was not received for ${phase}`)),
      PROOF_TIMEOUT,
    );
  });

  try {
    expect(await Promise.race([signal.promise, timeout])).to.eql({
      phase,
      trace: 'second,first',
      disposePreserved: true,
      asyncDisposePreserved: true,
    });
  } finally {
    clearTimeout(timer);
  }
}

function isPhase(input: string | null): input is Phase {
  return input === 'development' || input === 'production';
}

function withPhase(url: string, phase: Phase) {
  const next = new URL(url);
  next.searchParams.set('phase', phase);
  return next.href;
}

function isMissingFavicon(error: string) {
  return error.includes('404') && error.includes('/favicon.ico');
}

async function writeFixture(dir: string, proofUrl: string) {
  const nativeSymbolsKey = '__sysViteNativeDisposalSymbols';
  await Fs.writeJson(Fs.join(dir, 'deno.json'), { workspace: [], importMap: 'imports.json' });
  await Fs.writeJson(Fs.join(dir, 'imports.json'), { imports: {} });
  await Fs.write(
    Fs.join(dir, 'index.html'),
    Str.dedent(`
      <script>
        globalThis.${nativeSymbolsKey} = Object.freeze({
          dispose: Symbol.dispose,
          asyncDispose: Symbol.asyncDispose,
        });
      </script>
      <script type="module" src="./main.ts"></script>
    `),
  );
  await Fs.write(
    Fs.join(dir, 'main.ts'),
    Str.dedent(`
      type NativeSymbols = {
        readonly dispose: symbol;
        readonly asyncDispose: symbol;
      };

      const native = Reflect.get(globalThis, '${nativeSymbolsKey}') as NativeSymbols;
      const trace: string[] = [];
      {
        await using first = {
          async [Symbol.asyncDispose]() {
            await Promise.resolve();
            trace.push('first');
          },
        };
        using second = { [Symbol.dispose]: () => trace.push('second') };
        void first;
        void second;
      }

      const proof = {
        phase: new URL(location.href).searchParams.get('phase'),
        trace: trace.join(','),
        disposePreserved: native.dispose === Symbol.dispose,
        asyncDisposePreserved: native.asyncDispose === Symbol.asyncDispose,
      };
      if (proof.trace !== 'second,first') throw new Error('disposal-order:' + proof.trace);
      if (!proof.disposePreserved) throw new Error('dispose-symbol-identity');
      if (!proof.asyncDisposePreserved) throw new Error('async-dispose-symbol-identity');
      if (proof.phase !== 'development' && proof.phase !== 'production') {
        throw new Error('chromium-phase:' + proof.phase);
      }

      const url = new URL(${Json.stringify(proofUrl)});
      for (const [key, value] of Object.entries(proof)) url.searchParams.set(key, String(value));
      const response = await fetch(url);
      if (!response.ok) throw new Error('chromium-proof:' + response.status);
    `),
  );
  await Fs.write(
    Fs.join(dir, 'vite.config.ts'),
    Str.dedent(`
      import { Vite } from '@sys/driver-vite';
      export default Vite.Config.define(async () => await Vite.Config.app({
        paths: Vite.Config.paths({ app: { entry: './index.html' } }),
        plugins: { react: false },
        workspace: false,
      }));
    `),
  );
}
