import { describe, expect, it, Str } from '../../-test.ts';
import { parseProbeJson, PROBE_JSON_PREFIX, runProbe } from './u.fixture.probe.ts';
import { assertRunOk } from './u.fixture.task.ts';

describe('Vite disposal protocol compatibility runtime', () => {
  it('dev preserves incumbent protocol identities before entry evaluation', async () => {
    const res = await runProbe({
      name: 'dispose-protocol-compat.dev',
      source: DEV_PROBE_SOURCE,
      denoArgs: [
        'run',
        '-P=test',
        '--no-lock',
        '--allow-import=jsr.io,localhost',
        '--node-modules-dir=auto',
      ],
    });
    assertRunOk(res, 'disposal protocol compatibility runtime probe failed');

    const data = parseProbeJson<{
      ok: boolean;
      disposePreserved: boolean;
      asyncDisposePreserved: boolean;
      registryDispose: string | null;
      registryAsyncDispose: string | null;
    }>(res.stdout);

    expect(data.ok).to.eql(true);
    expect(data.disposePreserved).to.eql(true);
    expect(data.asyncDisposePreserved).to.eql(true);
    expect(data.registryDispose).to.eql(null);
    expect(data.registryAsyncDispose).to.eql(null);
  });

  it('build emits the installer once in each client bundle graph', async () => {
    const res = await runProbe({
      name: 'dispose-protocol-compat.build',
      source: BUILD_PROBE_SOURCE,
      denoArgs: [
        'run',
        '-P=test',
        '--no-lock',
        '--allow-import=jsr.io,localhost',
        '--node-modules-dir=auto',
      ],
    });
    assertRunOk(res, 'disposal protocol compatibility build probe failed');

    const data = parseProbeJson<{
      mainCount: number;
      workerCount: number;
      swCount: number;
    }>(res.stdout);

    expect(data.mainCount).to.eql(1);
    expect(data.workerCount).to.eql(1);
    expect(data.swCount).to.eql(1);
  });
});

const DEV_PROBE_SOURCE = Str.dedent(`
  import { Fs, Json, Testing } from './src/-test.ts';
  import { writeLocalFixtureImports } from './src/m.vite/-test/u.bridge.fixture.ts';
  import { Vite } from './src/m.vite/mod.ts';
  import { Str } from '@sys/std/str';

  const tmp = await Fs.makeTempDir({ prefix: 'Vite.dispose-protocol-compat.runtime.' });
  const dir = Fs.join(tmp.absolute, 'fixture');

  await Fs.writeJson(Fs.join(dir, 'deno.json'), { workspace: [], importMap: 'imports.json' });
  await Fs.writeJson(Fs.join(dir, 'imports.json'), { imports: {} });
  await Fs.write(
    Fs.join(dir, 'index.html'),
    '<script type="module" src="./main.ts"></script>',
  );
  await Fs.write(
    Fs.join(dir, 'main.ts'),
    Str.dedent(\`
      export const dispose = Symbol.dispose;
      export const asyncDispose = Symbol.asyncDispose;
      export const registryDispose = Symbol.keyFor(Symbol.dispose);
      export const registryAsyncDispose = Symbol.keyFor(Symbol.asyncDispose);
    \`),
  );
  await Fs.write(
    Fs.join(dir, 'vite.config.ts'),
    Str.dedent(\`
      import { Vite } from '@sys/driver-vite';
      export default Vite.Config.define(async () => await Vite.Config.app({
        paths: Vite.Config.paths({ app: { entry: './index.html' } }),
        plugins: { react: false },
        workspace: false,
      }));
    \`),
  );

  const restore = await writeLocalFixtureImports(dir);
  const dev = await Vite.dev({ cwd: dir, port: Testing.randomPort(), silent: true });
  const dispose = Symbol.dispose;
  const asyncDispose = Symbol.asyncDispose;

  try {
    const mod = await import(dev.url + 'main.ts');
    const disposePreserved = mod.dispose === dispose;
    const asyncDisposePreserved = mod.asyncDispose === asyncDispose;
    console.info('${PROBE_JSON_PREFIX}' + Json.stringify({
      ok: disposePreserved && asyncDisposePreserved &&
        mod.registryDispose === undefined && mod.registryAsyncDispose === undefined,
      disposePreserved,
      asyncDisposePreserved,
      registryDispose: mod.registryDispose ?? null,
      registryAsyncDispose: mod.registryAsyncDispose ?? null,
    }, 0));
  } finally {
    await dev.dispose();
    await restore();
    await Fs.remove(tmp.absolute, { log: false });
  }
`);

const BUILD_PROBE_SOURCE = Str.dedent(`
  import { Fs, Json } from './src/-test.ts';
  import { writeLocalFixtureImports } from './src/m.vite/-test/u.bridge.fixture.ts';
  import { Vite } from './src/m.vite/mod.ts';
  import { Str } from '@sys/std/str';

  const tmp = await Fs.makeTempDir({ prefix: 'Vite.dispose-protocol-compat.build.' });
  const dir = Fs.join(tmp.absolute, 'fixture');
  const outDir = Fs.join(dir, 'dist');

  await Fs.writeJson(Fs.join(dir, 'deno.json'), { workspace: [], importMap: 'imports.json' });
  await Fs.writeJson(Fs.join(dir, 'imports.json'), { imports: {} });
  await Fs.write(
    Fs.join(dir, 'index.html'),
    '<script type="module" src="./main.ts"></script>',
  );
  await Fs.write(
    Fs.join(dir, 'main.ts'),
    Str.dedent(\`
      new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      void import('./dynamic.ts');
      console.info('main-marker');
    \`),
  );
  await Fs.write(Fs.join(dir, 'dynamic.ts'), "console.info('dynamic-marker');");
  await Fs.write(Fs.join(dir, 'worker.ts'), "console.info('worker-marker');");
  await Fs.write(Fs.join(dir, 'sw.ts'), "console.info('sw-marker');");
  await Fs.write(
    Fs.join(dir, 'vite.config.ts'),
    Str.dedent(\`
      import { Vite } from '@sys/driver-vite';
      export default Vite.Config.define(async () => await Vite.Config.app({
        paths: Vite.Config.paths({ app: { entry: './index.html', sw: './sw.ts' } }),
        plugins: { react: false },
        workspace: false,
        minify: false,
      }));
    \`),
  );

  const restore = await writeLocalFixtureImports(dir);
  try {
    const result = await Vite.build({ cwd: dir, silent: true, spinner: false, exitOnError: false });
    if (!result.ok) throw new Error(result.toString());

    const files = Object.keys(result.dist.hash.parts).filter((path) => path.endsWith('.js'));
    const sources = await Promise.all(files.map(async (path) => ({
      path,
      text: (await Fs.readText(Fs.join(outDir, path))).data ?? '',
    })));
    const count = (text: string) => text.split('ECMAScript disposal protocol symbols are incompatible').length - 1;
    const mainGraph = sources.filter((file) => file.path !== 'sw.js' && !file.text.includes('worker-marker'))
      .map((file) => file.text).join('\\n');
    const worker = sources.find((file) => file.text.includes('worker-marker'))?.text ?? '';
    const sw = sources.find((file) => file.path === 'sw.js')?.text ?? '';
    const swImports = [...sw.matchAll(/import\\s+["'](.+?)["']/g)].map((match) => match[1]);
    const swGraph = [sw, ...swImports.map((path) => {
      const normalized = path.startsWith('./') ? path.slice(2) : path;
      return sources.find((file) => file.path === normalized)?.text ?? '';
    })].join('\\n');

    console.info('${PROBE_JSON_PREFIX}' + Json.stringify({
      mainCount: count(mainGraph),
      workerCount: count(worker),
      swCount: count(swGraph),
    }, 0));
  } finally {
    await restore();
    await Fs.remove(tmp.absolute, { log: false });
  }
`);
