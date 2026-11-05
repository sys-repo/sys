import { describe, expect, Fs, it, Json, Path, Process, ROOT } from '../../-test.ts';

const CWD = ROOT.resolve('code/sys.driver/driver-vite');
const CHILD = Path.fromFileUrl(new URL('./u.fixture.import-boundary.ts', import.meta.url));
const CANARY = new URL('./u.fixture.import-boundary.canary.ts', import.meta.url).href;
const SCOPE = new URL('../../', import.meta.url).href;

describe('Vite import execution boundary: installed dependencies', () => {
  it('installed dependencies → public imports and helpers need no build authority', async () => {
    await run('root');
    await run('config');
  });
});

describe('Vite import execution boundary: changed initializers', () => {
  it('changed dependency initializers → imports stay inert; explicit execution preserves rejection', async () => {
    const temporary = await Fs.makeTempDir({ prefix: 'Vite.import-boundary.' });
    try {
      const source = (await Fs.readJson<{ imports: Record<string, string> }>(
        ROOT.resolve('imports.json'),
      )).data;
      if (!source) throw new Error('Missing workspace import map.');
      const map = Path.join(temporary.absolute, 'imports.json');
      await Fs.write(
        map,
        Json.stringify({
          imports: source.imports,
          scopes: {
            [SCOPE]: {
              '@vitejs/plugin-react': CANARY,
              '@deno/loader': CANARY,
              vite: CANARY,
            },
          },
        }),
      );

      for (const mode of ['root', 'config', 'app', 'fromFile', 'resolver', 'load']) {
        await run(mode, map);
      }
    } finally {
      await Fs.remove(temporary.absolute);
    }
  });
});

async function run(mode: string, importMap?: string) {
  const output = await Process.capture({
    cwd: CWD,
    args: [
      'run',
      '--frozen',
      '--cached-only',
      '--no-prompt',
      '--allow-read',
      '--allow-env',
      ...(importMap ? [`--import-map=${importMap}`] : []),
      CHILD,
      mode,
    ],
    executionTimeout: 15_000,
    maxStdoutBytes: 64 * 1024,
    maxStderrBytes: 64 * 1024,
  });
  expect(output.outcome, output.text.stderr).to.eql('exited');
  expect(output.code, output.text.stderr).to.eql(0);
  expect(output.text.stdout.trim()).to.eql(`import-boundary:${mode}:ok`);
}
