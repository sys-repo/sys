import { type t, Fs, c, describe, expect, it } from '../../-test.ts';
import { ViteConfig } from '../mod.ts';

describe('Config.Build', () => {
  const { brightCyan: cyan } = c;

  describe('app (application)', () => {
    const includesPlugin = (config: t.ViteUserConfig, name: string) => {
      const plugins = (config.plugins ?? []).flat() as t.VitePlugin[];
      return plugins.some((p) => p.name.toLowerCase().includes(name));
    };

    const print = (config: t.ViteUserConfig, titleSuffix?: string, paths?: t.ViteConfigPaths) => {
      if (paths) {
        console.info();
        console.info(cyan(c.bold('↓ INPUT paths')));
        console.info(paths);
        console.info();
      }

      console.info();
      console.info(cyan(c.bold('↓ ViteConfig.app')), c.gray(titleSuffix ?? ''));
      console.info({
        ...config,
        plugins: ((config.plugins ?? []) as t.VitePlugin[]).flat().map((m) => m.name),
        resolve: {
          ...config.resolve,
          alias: `← 🌳 ${config.resolve?.alias?.length} aliases (across workspace)`,
        },
      });
      console.info();
      return config;
    };

    it('defaults', async () => {
      const p = ViteConfig.paths();
      const config = await ViteConfig.app();
      print(config, '(defaults)', p);

      const input = config.build?.rollupOptions?.input as any;

      expect(config.root).to.eql(p.cwd);
      expect(config.envDir).to.eql(p.cwd);
      expect(config.build?.outDir).to.eql(Fs.join(p.cwd, p.app.outDir));
      expect(input.main).to.eql(Fs.join(p.cwd, p.app.entry));

      expect(includesPlugin(config, 'wasm')).to.be.true;
      expect(includesPlugin(config, 'react')).to.be.true;
      expect(includesPlugin(config, 'sys:specifier-rewrite')).to.be.true;
    });

    it('no plugins', async () => {
      const config = await ViteConfig.app({ plugins: { wasm: false, react: false, deno: false } });
      expect(config.plugins).to.eql([]);
    });

    it('custom paths', async () => {
      const paths = ViteConfig.paths({
        cwd: ' /foo/ ', // NB: absolute path (trimmed internally).
        app: {
          entry: 'src/-foo.html',
          outDir: 'foobar/out',
          sw: 'src/sw.ts', // NB: service-worker.
        },
      });
      const config = await ViteConfig.app({ paths });
      print(config, '(custom paths)', paths);

      expect(config.root).to.eql('/foo/src');
      expect(config.build?.outDir).to.eql(Fs.join(paths.cwd, 'foobar/out'));

      const input = config.build?.rollupOptions?.input as any;
      expect(input.main).to.eql(Fs.join(paths.cwd, 'src/-foo.html'));
      expect(input.sw).to.eql(Fs.join(paths.cwd, 'src/sw.ts'));
      expect(config.envDir).to.eql(paths.cwd);
    });

    it('keeps env loading rooted at package cwd when app root is nested', async () => {
      const paths = ViteConfig.paths({
        cwd: '/pkg',
        app: { entry: 'src/-test/index.html' },
      });
      const config = await ViteConfig.app({ paths });

      expect(config.root).to.eql('/pkg/src/-test');
      expect(config.envDir).to.eql('/pkg');
    });
  });
});
