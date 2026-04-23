import { type t, Fs, c, describe, expect, it, Json } from '../../-test.ts';
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
      expect(config.optimizeDeps).to.eql(undefined);
      expect(config.resolve?.dedupe).to.eql(['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime']);

      expect(includesPlugin(config, 'wasm')).to.be.true;
      expect(includesPlugin(config, 'react')).to.be.true;
      expect(includesPlugin(config, 'sys:specifier-rewrite')).to.be.true;
    });

    it('no common plugins', async () => {
      const config = await ViteConfig.app({ plugins: { wasm: false, react: false, deno: false } });
      const names = ((config.plugins ?? []) as t.VitePlugin[]).flat().map((m) => m.name);

      expect(names).to.eql(['sys:optimize-imports']);
    });

    it('appends caller-supplied vite plugins after the driver/common plugin set', async () => {
      const customA: t.VitePlugin = { name: 'custom:a' };
      const customB: t.VitePlugin = { name: 'custom:b' };
      const config = await ViteConfig.app({ vitePlugins: [customA, customB] });
      const names = ((config.plugins ?? []) as t.VitePlugin[]).flat().map((m) => m.name);

      const specifierRewrite = names.indexOf('sys:specifier-rewrite');
      const customAIndex = names.indexOf('custom:a');
      const customBIndex = names.indexOf('custom:b');
      const reactIndex = names.findIndex((name) => name.includes('react'));

      expect(customAIndex > -1).to.eql(true);
      expect(customBIndex > -1).to.eql(true);
      expect(specifierRewrite > -1).to.eql(true);
      expect(reactIndex > -1).to.eql(true);
      expect(customAIndex > specifierRewrite).to.eql(true);
      expect(customAIndex > reactIndex).to.eql(true);
      expect(customBIndex > customAIndex).to.eql(true);
    });

    it('keeps visualizer last after caller-supplied vite plugins', async () => {
      const custom: t.VitePlugin = { name: 'custom:a' };
      const config = await ViteConfig.app({
        vitePlugins: [custom],
        visualizer: true,
      });
      const names = ((config.plugins ?? []) as t.VitePlugin[]).flat().map((m) => m.name);

      expect(names.at(-2)).to.eql('custom:a');
      expect(names.at(-1)).to.eql('visualizer');
    });

    it('supports app config without a workspace', async () => {
      const config = await ViteConfig.app({ workspace: false });

      expect(config.resolve?.alias).to.eql(undefined);
      expect(includesPlugin(config, 'sys:specifier-rewrite')).to.eql(true);
      expect(includesPlugin(config, 'sys:npm-prewarm')).to.eql(false);
    });

    it('does not mount npm prewarm when local deno.json uses manual node-modules mode', async () => {
      const fs = await Fs.makeTempDir({ prefix: 'ViteConfig.app.manual-node-modules.' });
      try {
        await Fs.write(
          Fs.join(fs.absolute, 'deno.json'),
          Json.stringify({
            name: '@tmp/manual',
            version: '0.0.0',
            nodeModulesDir: 'manual',
            importMap: 'imports.json',
          }, 2),
        );
        await Fs.write(Fs.join(fs.absolute, 'imports.json'), Json.stringify({ imports: {} }, 2));

        const paths = ViteConfig.paths({ cwd: fs.absolute });
        const config = await ViteConfig.app({ workspace: false, paths });

        expect(config.resolve?.alias).to.eql(undefined);
        expect(includesPlugin(config, 'sys:specifier-rewrite')).to.eql(true);
        expect(includesPlugin(config, 'sys:npm-prewarm')).to.eql(false);
      } finally {
        await Fs.remove(fs.absolute);
      }
    });

    it('does not mount deno plugins when no local deno.json exists', async () => {
      const fs = await Fs.makeTempDir({ prefix: 'ViteConfig.app.no-deno.' });
      try {
        const paths = ViteConfig.paths({ cwd: fs.absolute });
        const config = await ViteConfig.app({ workspace: false, paths });

        expect(config.resolve?.alias).to.eql(undefined);
        expect(includesPlugin(config, 'sys:specifier-rewrite')).to.eql(false);
        expect(includesPlugin(config, 'sys:npm-prewarm')).to.eql(false);
      } finally {
        await Fs.remove(fs.absolute);
      }
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
        app: { entry: 'src/index.html' },
      });
      const config = await ViteConfig.app({ paths });

      expect(config.root).to.eql('/pkg/src');
      expect(config.envDir).to.eql('/pkg');
    });

    it('passes optimizeDeps through without adding driver defaults', async () => {
      const optimizeDeps: NonNullable<t.ViteUserConfig['optimizeDeps']> = {
        include: ['react', 'react-dom/client'],
        exclude: ['@acme/skip'],
        entries: ['src/-test/index.html'],
      };
      const config = await ViteConfig.app({ optimizeDeps });

      expect(config.optimizeDeps).to.eql(optimizeDeps);
    });

    it('adapts chunk aliases to a manualChunks function for resolved node_modules ids', async () => {
      const config = await ViteConfig.app({
        chunks(e) {
          e.chunk('react', 'react');
          e.chunk('react.dom', 'react-dom');
        },
      });

      const manualChunks = config.build?.rollupOptions?.output as t.Rollup.OutputOptions;
      const chunk = manualChunks.manualChunks as undefined | ((id: string) => string | undefined);

      expect(typeof chunk).to.eql('function');
      expect(chunk?.('/tmp/node_modules/.deno/react@19.2.5/node_modules/react/index.js')).to.eql('react');
      expect(chunk?.('/tmp/node_modules/.deno/react-dom@19.2.5/node_modules/react-dom/client.js')).to.eql('react.dom');
      expect(chunk?.('/tmp/node_modules/.deno/lodash@4.17.21/node_modules/lodash/map.js')).to.eql(undefined);
    });
  });
});
