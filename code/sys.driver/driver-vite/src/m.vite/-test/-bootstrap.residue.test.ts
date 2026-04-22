import { describe, expect, Fs, it } from '../../-test.ts';
import { Wrangle } from '../u.wrangle.ts';

describe('Bootstrap residue world', () => {
  it('build: delivery materialization stays out of the consumer root surface during normal operation', async () => {
    const ctx = await fixture('vite.bootstrap.residue.build-');
    expect(await visibleBootstrapFiles(ctx.root)).to.eql([]);

    const res = await Wrangle.command(ctx.paths, 'build');
    try {
      expect(await visibleBootstrapFiles(ctx.root)).to.eql([]);
      const importMapPath = importMapArg(res.args);
      expect(importMapPath.includes('node_modules/.vite/.sys-driver-vite/startup')).to.eql(true);
      expect(await Fs.exists(importMapPath)).to.eql(true);
    } finally {
      await res.dispose();
    }

    expect(await visibleBootstrapFiles(ctx.root)).to.eql([]);
  });

  it('dev: delivery materialization stays out of the consumer root surface during normal operation', async () => {
    const ctx = await fixture('vite.bootstrap.residue.dev-');
    expect(await visibleBootstrapFiles(ctx.root)).to.eql([]);

    const res = await Wrangle.command(ctx.paths, 'dev --port=4173 --host');
    try {
      expect(await visibleBootstrapFiles(ctx.root)).to.eql([]);
      const importMapPath = importMapArg(res.args);
      expect(importMapPath.includes('node_modules/.vite/.sys-driver-vite/startup')).to.eql(true);
      expect(await Fs.exists(importMapPath)).to.eql(true);
    } finally {
      await res.dispose();
    }

    expect(await visibleBootstrapFiles(ctx.root)).to.eql([]);
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

function importMapArg(args: readonly string[]) {
  return args.find((item) => item.startsWith('--import-map='))?.replace('--import-map=', '') ?? '';
}

async function visibleBootstrapFiles(root: string) {
  const paths = await Fs.ls(root, { trimCwd: true, depth: 1 });
  return paths
    .map((path) => Fs.basename(path))
    .filter((name) => name.startsWith('.vite.bootstrap.'))
    .sort();
}
