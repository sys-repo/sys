import { Fs, SAMPLE, type t } from '../../-test.ts';

type NativeBuildFixture = {
  readonly cwd: t.StringDir;
  readonly paths: t.ViteConfig.Paths;
  [Symbol.asyncDispose](): Promise<void>;
};

/** Real local-JS builds under existing workspace authority, without the Deno transport plugins. */
export async function createNativeBuildFixture(label: string): Promise<NativeBuildFixture> {
  const fs = await SAMPLE.fs(label, { location: 'local-temp' });
  const cwd = fs.join('fixture');
  const paths = { cwd, app: { entry: 'index.html', outDir: 'dist', base: './' } } as const;
  const fixture: NativeBuildFixture = {
    cwd,
    paths,
    async [Symbol.asyncDispose]() {
      await Fs.remove(fs.dir, { log: false });
    },
  };
  try {
    await Fs.ensureDir(cwd);
    await Fs.write(fs.join('fixture/vite.config.ts'), 'export default {};\n', { throw: true });
    await Fs.write(
      fs.join('fixture/index.html'),
      '<!doctype html><html><head><title>Native producer control</title></head>' +
        '<body><script type="module" src="./main.js"></script></body></html>\n',
      { throw: true },
    );
    await Fs.write(
      fs.join('fixture/main.js'),
      'document.body.dataset.fixture = "native-producer-control";\n',
      { throw: true },
    );
    return fixture;
  } catch (error) {
    try {
      await fixture[Symbol.asyncDispose]();
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        'Native build fixture setup and cleanup failed.',
      );
    }
    throw error;
  }
}
