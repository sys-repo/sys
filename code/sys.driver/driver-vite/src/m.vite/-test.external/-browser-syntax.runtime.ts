import { describe, expect, it, Str } from '../../-test.ts';
import { parseProbeJson, PROBE_JSON_PREFIX, runProbe } from './u.fixture.probe.ts';
import { assertRunOk } from './u.fixture.task.ts';

describe('Vite browser syntax runtime', () => {
  it('runs lowered disposal semantics against compatibility-installed symbols', async () => {
    const res = await runProbe({
      name: 'browser-syntax-runtime',
      source: PROBE_SOURCE,
      denoArgs: [
        'run',
        '-P=test',
        '--no-lock',
        '--allow-import=jsr.io,localhost',
        '--node-modules-dir=auto',
      ],
    });
    assertRunOk(res, 'browser syntax runtime probe failed');

    const data = parseProbeJson<{
      trace: string[];
      disposeRegistry: string | null;
      asyncDisposeRegistry: string | null;
      disposeIsFresh: boolean;
      asyncDisposeIsFresh: boolean;
      error: {
        name: string;
        error?: { message: string };
        suppressed?: { message: string };
      };
    }>(res.stdout);

    expect(data.trace).to.eql(['last', 'fallback', 'first:start', 'first:end']);
    expect(data.disposeRegistry).to.eql(null);
    expect(data.asyncDisposeRegistry).to.eql(null);
    expect(data.disposeIsFresh).to.eql(true);
    expect(data.asyncDisposeIsFresh).to.eql(true);
    expect(data.error.name).to.eql('SuppressedError');
    expect(data.error.error?.message).to.eql('dispose:last');
    expect(data.error.suppressed?.message).to.eql('body');
  });
});

const PROBE_SOURCE = Str.dedent(`
  import { Delete, Fs, Is, Json } from './src/-test.ts';
  import { writeLocalFixtureImports } from './src/m.vite/-test/u.bridge.fixture.ts';
  import { Vite } from './src/m.vite/mod.ts';
  import { hasExplicitResourceManagementSyntax } from './src/m.vite/-test/u.syntax.ts';
  import { Str } from '@sys/std/str';

  const tmp = await Fs.makeTempDir({ prefix: 'Vite.browser-syntax.runtime.' });
  const dir = Fs.join(tmp.absolute, 'fixture');
  const outDir = Fs.join(dir, 'dist');
  const resultKey = '__sysViteBrowserSyntaxResult';

  await Fs.writeJson(Fs.join(dir, 'deno.json'), { workspace: [], importMap: 'imports.json' });
  await Fs.writeJson(Fs.join(dir, 'imports.json'), { imports: {} });
  await Fs.write(Fs.join(dir, 'index.html'), '<script type="module" src="./main.ts"></script>');
  await Fs.write(Fs.join(dir, 'main.ts'), "console.info('main');");
  await Fs.write(
    Fs.join(dir, 'probe.ts'),
    Str.dedent(\`
      const trace: string[] = [];
      let error: unknown;

      try {
        await using first = {
          async [Symbol.asyncDispose]() {
            trace.push('first:start');
            await Promise.resolve();
            trace.push('first:end');
          },
        };
        await using fallback = { [Symbol.dispose]: () => trace.push('fallback') };
        using last = {
          [Symbol.dispose]() {
            trace.push('last');
            throw new Error('dispose:last');
          },
        };
        void first;
        void fallback;
        void last;
        throw new Error('body');
      } catch (cause) {
        error = cause;
      }

      type ErrorShape = {
        readonly name?: unknown;
        readonly message?: unknown;
        readonly error?: ErrorShape;
        readonly suppressed?: ErrorShape;
      };

      const shape = (input: unknown): ErrorShape | undefined => {
        if (typeof input !== 'object' || input === null) return;
        return {
          name: Reflect.get(input, 'name'),
          message: Reflect.get(input, 'message'),
          error: shape(Reflect.get(input, 'error')),
          suppressed: shape(Reflect.get(input, 'suppressed')),
        };
      };

      Reflect.set(globalThis, '\${resultKey}', {
        trace,
        dispose: Symbol.dispose,
        asyncDispose: Symbol.asyncDispose,
        error: shape(error),
      });
    \`),
  );
  await Fs.write(
    Fs.join(dir, 'vite.config.ts'),
    Str.dedent(\`
      import { Vite } from '@sys/driver-vite';
      export default Vite.Config.define(async () => await Vite.Config.app({
        paths: Vite.Config.paths({ app: { entry: './index.html', sw: './probe.ts' } }),
        plugins: { react: false },
        workspace: false,
        minify: false,
      }));
    \`),
  );

  const restore = await writeLocalFixtureImports(dir);
  const nativeSymbol = Symbol;
  const globalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Symbol');
  if (!globalDescriptor) throw new Error('Missing global Symbol descriptor');

  function CompatibilitySymbol(description?: string) {
    return nativeSymbol(description);
  }
  CompatibilitySymbol.prototype = nativeSymbol.prototype;
  const descriptors = Delete.fields(
    Object.getOwnPropertyDescriptors(nativeSymbol),
    'dispose',
    'asyncDispose',
    'length',
    'name',
    'prototype',
  );
  Object.defineProperties(CompatibilitySymbol, descriptors);

  try {
    const result = await Vite.build({ cwd: dir, silent: true, spinner: false, exitOnError: false });
    if (!result.ok) throw new Error(result.toString());

    const source = (await Fs.readText(Fs.join(outDir, 'sw.js'))).data ?? '';
    if (hasExplicitResourceManagementSyntax(source)) {
      throw new Error('Explicit Resource Management syntax was not lowered');
    }

    Object.defineProperty(globalThis, 'Symbol', { ...globalDescriptor, value: CompatibilitySymbol });
    await import(Fs.Path.toFileUrl(Fs.join(outDir, 'sw.js')).href + '?probe');
    const data = Reflect.get(globalThis, resultKey);
    if (!Is.record(data)) throw new Error('Browser syntax runtime result was not recorded');
    if (!Is.symbol(data.dispose) || !Is.symbol(data.asyncDispose)) {
      throw new Error('Browser syntax runtime did not expose disposal symbols');
    }
    console.info('${PROBE_JSON_PREFIX}' + Json.stringify({
      trace: data.trace,
      error: data.error,
      disposeRegistry: nativeSymbol.keyFor(data.dispose) ?? null,
      asyncDisposeRegistry: nativeSymbol.keyFor(data.asyncDispose) ?? null,
      disposeIsFresh: data.dispose !== nativeSymbol.dispose,
      asyncDisposeIsFresh: data.asyncDispose !== nativeSymbol.asyncDispose,
    }, 0));
  } finally {
    Object.defineProperty(globalThis, 'Symbol', globalDescriptor);
    Reflect.deleteProperty(globalThis, resultKey);
    await restore();
    await Fs.remove(tmp.absolute, { log: false });
  }
`);
