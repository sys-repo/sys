import { describe, expect, it, Str } from '../../-test.ts';
import { parseProbeJson, PROBE_JSON_PREFIX, runProbe } from './u.fixture.probe.ts';
import { assertRunOk } from './u.fixture.task.ts';

describe('Vite external std try runtime', () => {
  it('consumer dev entry importing @sys/std/try evaluates without Try TDZ crash', async () => {
    const res = await runProbe({
      name: 'std-try-runtime',
      source: PROBE_SOURCE,
      denoArgs: [
        'run',
        '-P=test',
        '--no-lock',
        '--allow-import=jsr.io,localhost',
        '--node-modules-dir=auto',
      ],
    });
    assertRunOk(res, 'std/try runtime probe failed');

    const data = parseProbeJson<{
      ok: boolean;
      tryOk: boolean | null;
      tryMessage: string | null;
      entryUrl: string;
    }>(res.stdout);

    expect(data.ok).to.eql(true);
    expect(data.tryOk).to.eql(true);
    expect(data.tryMessage).to.eql('ok');
    expect(data.entryUrl.endsWith('/main.ts')).to.eql(true);
  });
});

/**
 * Driver-vite runtime canary, not a generic std test: the old failure only
 * appeared after Vite served/transformed `@sys/std/try` and Deno evaluated the
 * localhost module graph.
 *
 * Keep this as generated child-source instead of a published fixture file: the
 * probe must dynamically import a runtime localhost URL, which is intentionally
 * unanalyzable at publish time.
 */
const PROBE_SOURCE = Str.dedent(`
  import { Fs, Json, Testing } from './src/-test.ts';
  import { writeLocalFixtureImports } from './src/m.vite/-test/u.bridge.fixture.ts';
  import { Vite } from './src/m.vite/mod.ts';
  import { Str } from '@sys/std/str';

  const tmp = await Fs.makeTempDir({ prefix: 'Vite.external.std-try.runtime.' });
  const dir = Fs.join(tmp.absolute, 'fixture');

  await Fs.writeJson(Fs.join(dir, 'deno.json'), {
    workspace: [],
    importMap: 'imports.json',
  });
  await Fs.writeJson(Fs.join(dir, 'imports.json'), { imports: {} });
  await Fs.write(
    Fs.join(dir, 'index.html'),
    Str.dedent(\`<!DOCTYPE html>
    <html lang="en">
      <body>
        <script type="module" src="./main.ts"></script>
      </body>
    </html>
    \`),
  );
  await Fs.write(
    Fs.join(dir, 'main.ts'),
    Str.dedent(\`
      import { Try } from '@sys/std/try';
      const runResult = Try.run(() => 'ok');
      export const tryOk = runResult.result.ok;
      export const tryMessage = runResult.result.ok ? runResult.result.data : runResult.result.error.message;
      console.info('std-try-runtime', tryMessage);
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

  try {
    const entryUrl = dev.url + 'main.ts';
    const mod = await import(entryUrl);
    console.log('${PROBE_JSON_PREFIX}' + Json.stringify({
      ok: mod.tryOk === true && mod.tryMessage === 'ok',
      tryOk: mod.tryOk ?? null,
      tryMessage: mod.tryMessage ?? null,
      entryUrl,
    }, 0));
  } finally {
    await dev.dispose();
    await restore();
    await Fs.remove(tmp.absolute, { log: false });
  }
`);
