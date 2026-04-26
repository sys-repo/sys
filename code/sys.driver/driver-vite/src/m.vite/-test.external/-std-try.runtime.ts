import { describe, expect, Fs, it, Json, Process, ROOT, Str } from '../../-test.ts';

describe('Vite external std try runtime', () => {
  it('consumer dev entry importing @sys/std/try evaluates without Try TDZ crash', async () => {
    const res = await runProbe(PROBE_SOURCE);
    if (!res.success) {
      throw new Error(Str.dedent(`
        std/try runtime probe failed.

        stdout:
        ${res.text.stdout.trim()}

        stderr:
        ${res.text.stderr.trim()}
      `));
    }

    const data = parseProbeJson<{
      ok: boolean;
      tryOk: boolean | null;
      tryMessage: string | null;
      entryUrl: string;
    }>(res.text.stdout);

    expect(data.ok).to.eql(true);
    expect(data.tryOk).to.eql(true);
    expect(data.tryMessage).to.eql('ok');
    expect(data.entryUrl.endsWith('/main.ts')).to.eql(true);
  });
});

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
      import { defineConfig } from 'npm:vite';
      export default defineConfig(async () => await Vite.Config.app({
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
    console.log(Json.stringify({
      ok: mod.tryOk === true && mod.tryMessage === 'ok',
      tryOk: mod.tryOk ?? null,
      tryMessage: mod.tryMessage ?? null,
      entryUrl,
    }));
  } finally {
    await dev.dispose();
    await restore();
    await Fs.remove(tmp.absolute, { log: false });
  }
`);

function parseProbeJson<T>(stdout: string): T {
  const lines = stdout.trim().split('\n').filter(Boolean);
  const line = lines.at(-1) ?? '{}';
  return Json.parse(line) as T;
}

async function runProbe(source: string) {
  const cwd = ROOT.resolve('code/sys.driver/driver-vite');
  const path = Fs.join(cwd, `.tmp.std-try-runtime.${crypto.randomUUID()}.ts`);
  await Fs.write(path, source);

  try {
    return await Process.invoke({
      cmd: 'deno',
      args: ['run', '-P=test', '--allow-import=jsr.io,localhost', '--node-modules-dir=auto', path],
      cwd,
      silent: true,
    });
  } finally {
    await Fs.remove(path, { log: false });
  }
}
