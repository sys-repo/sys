import { type t, Fs, c, describe, expect, it } from '../-test.ts';
import { ViteConfig } from './mod.ts';

describe('Config.Build', () => {
  const { brightCyan: cyan } = c;

  describe('app (application)', () => {
    const includesPlugin = (config: t.ViteUserConfig, name: string) => {
      const plugins = (config.plugins ?? []).flat() as t.VitePlugin[];
      return plugins.some((p) => p.name === name);
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


      expect(includesPlugin(config, 'vite-plugin-wasm')).to.be.true;
      expect(includesPlugin(config, 'vite:react-swc')).to.be.true;
    });

    it('no plugins', async () => {
      const config = await ViteConfig.app({ plugins: { wasm: false, react: false, deno: false } });
      expect(config.plugins).to.eql([]);
    });

    it('custom paths', async () => {
      const paths = ViteConfig.paths({
        cwd: ' /foo/ ',
        app: { entry: 'src/-foo.html', outDir: 'bar' },
      });
      const config = await ViteConfig.app({ paths });
      expect(config.root).to.eql('/foo/src');
      expect(config.build?.rollupOptions?.input).to.eql(Fs.join(paths.cwd, paths.app.entry));
      expect(config.build?.outDir).to.eql(Fs.join(paths.cwd, paths.app.outDir));
    });
  });
});
