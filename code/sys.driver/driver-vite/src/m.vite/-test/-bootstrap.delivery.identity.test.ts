import { describe, expect, Fs, it, Path, type t } from '../../-test.ts';
import { Wrangle } from '../u/u.wrangle.ts';

describe('Bootstrap command delivery', () => {
  for (const mode of ['build', 'dev'] as const) {
    it(`${mode}: stable authority identity with independent delivery lifetimes`, async () => {
      await using ctx = await fixture(`vite.bootstrap.identity.${mode}-`);
      const arg = mode === 'build' ? mode : 'dev --port=4321 --host';
      await using first = await capture(ctx.paths, arg);
      await using second = await capture(ctx.paths, arg);

      expect(first.importMapPath).not.to.eql(second.importMapPath);
      expect(Path.basename(first.importMapPath)).to.eql(Path.basename(second.importMapPath));
      expect(first.moduleSyncPath).not.to.eql(second.moduleSyncPath);
      expect(first.args).to.eql(second.args);
      await first.dispose();
      expect(await Fs.exists(second.importMapPath)).to.eql(true);
      // Pin the emitted shim bytes, including its trailing newline.
      expect((await Fs.readText(Path.fromFileUrl(second.moduleSyncPath))).data).to.eql(
        'export default false;\n',
      );
    });
  }
});

async function fixture(prefix: string) {
  const tmp = await Fs.makeTempDir({ prefix });
  const root = tmp.absolute;
  await Fs.writeJson(`${root}/package.json`, {
    dependencies: {
      vite: '8.0.9',
    },
  });
  await Fs.writeJson(`${root}/deno.json`, {
    imports: {
      '@sys/http': './src/http.ts',
    },
  });

  return {
    async [Symbol.asyncDispose]() {
      await Fs.remove(root);
    },
    paths: {
      cwd: root,
      app: {
        entry: 'index.html',
        outDir: 'dist',
        base: '.',
      },
    } as const,
  };
}

async function capture(paths: t.ViteConfig.Paths, arg: string) {
  const res = await Wrangle.command(paths, arg);
  const importMapArg = res.args.find((item) => item.startsWith('--import-map='));
  const importMapPath = importMapArg?.replace('--import-map=', '') ?? '';
  const importMap = importMapPath
    ? await Fs.readJson<{ imports?: t.ViteStartup.Imports }>(importMapPath)
    : undefined;

  return {
    args: res.args.filter((arg) => !arg.startsWith('--import-map=')),
    importMapPath,
    moduleSyncPath: importMap?.data?.imports?.['#module-sync-enabled'] ?? '',
    dispose: res.dispose,
    [Symbol.asyncDispose]: res.dispose,
  } as const;
}
