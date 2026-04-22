import { describe, expect, Fs, it } from '../../-test.ts';
import { Wrangle } from '../u.wrangle.ts';

describe('Bootstrap residue world', () => {
  it('build: current delivery materialization is visible in the consumer root until cleanup', async () => {
    const ctx = await fixture('vite.bootstrap.residue.build-');
    expect(await visibleBootstrapFiles(ctx.root)).to.eql([]);

    const res = await Wrangle.command(ctx.paths, 'build');
    try {
      const during = await visibleBootstrapFiles(ctx.root);
      expect(during.some((name) => name.endsWith('.imports.json'))).to.eql(true);
      expect(during.some((name) => name.endsWith('.module-sync-enabled.mjs'))).to.eql(true);
    } finally {
      await res.dispose();
    }

    expect(await visibleBootstrapFiles(ctx.root)).to.eql([]);
  });

  it('dev: current delivery materialization is visible in the consumer root until cleanup', async () => {
    const ctx = await fixture('vite.bootstrap.residue.dev-');
    expect(await visibleBootstrapFiles(ctx.root)).to.eql([]);

    const res = await Wrangle.command(ctx.paths, 'dev --port=4173 --host');
    try {
      const during = await visibleBootstrapFiles(ctx.root);
      expect(during.some((name) => name.endsWith('.imports.json'))).to.eql(true);
      expect(during.some((name) => name.endsWith('.module-sync-enabled.mjs'))).to.eql(true);
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

async function visibleBootstrapFiles(root: string) {
  const names: string[] = [];
  for await (const entry of Deno.readDir(root)) {
    if (!entry.name.startsWith('.vite.bootstrap.')) continue;
    names.push(entry.name);
  }
  return names.sort();
}
