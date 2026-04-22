import { describe, expect, Fs, it } from '../../-test.ts';
import { Wrangle } from '../u.wrangle.ts';

describe('Bootstrap delivery identity world', () => {
  it('build: equivalent inputs currently churn delivery handle identity', async () => {
    const ctx = await fixture('vite.bootstrap.identity.build-');
    const first = await capture(ctx.paths, 'build');
    const second = await capture(ctx.paths, 'build');

    try {
      expect(first.importMapPath).to.not.eql(second.importMapPath);
      expect(first.moduleSyncPath).to.not.eql(second.moduleSyncPath);
      expect(first.cmd).to.not.eql(second.cmd);
    } finally {
      await first.dispose();
      await second.dispose();
    }
  });

  it('dev: equivalent inputs currently churn delivery handle identity', async () => {
    const ctx = await fixture('vite.bootstrap.identity.dev-');
    const first = await capture(ctx.paths, 'dev --port=4321 --host');
    const second = await capture(ctx.paths, 'dev --port=4321 --host');

    try {
      expect(first.importMapPath).to.not.eql(second.importMapPath);
      expect(first.moduleSyncPath).to.not.eql(second.moduleSyncPath);
      expect(first.cmd).to.not.eql(second.cmd);
    } finally {
      await first.dispose();
      await second.dispose();
    }
  });
});

async function fixture(prefix: string) {
  const tmp = await Fs.makeTempDir({ prefix });
  const root = tmp.absolute;
  await Fs.writeJson(`${root}/package.json`, {
    dependencies: {
      vite: '8.0.9',
      esbuild: '0.27.4',
    },
  });
  await Fs.writeJson(`${root}/deno.json`, {
    imports: {
      '@sys/http': './src/http.ts',
    },
  });

  return {
    root,
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

async function capture(
  paths: {
    readonly cwd: string;
    readonly app: { readonly entry: string; readonly outDir: string; readonly base: string };
  },
  arg: string,
) {
  const res = await Wrangle.command(paths, arg);
  const importMapArg = res.args.find((item) => item.startsWith('--import-map='));
  const importMapPath = importMapArg?.replace('--import-map=', '') ?? '';
  const importMap = importMapPath
    ? await Fs.readJson<{ imports?: Record<string, string> }>(importMapPath)
    : undefined;

  return {
    cmd: res.cmd,
    importMapPath,
    moduleSyncPath: importMap?.data?.imports?.['#module-sync-enabled'] ?? '',
    dispose: res.dispose,
  } as const;
}
