import { type t, Fs, describe, expect, it } from '../-test.ts';
import { ViteConfig } from './mod.ts';

describe('Config.Build', () => {
  describe('app (application)', () => {
    const includesPlugin = (config: t.ViteUserConfig, name: string) => {
      const plugins = (config.plugins ?? []).flat() as t.VitePlugin[];
      return plugins.some((p) => p.name === name);
    };

    it('default', async () => {
      const config = await ViteConfig.app();
      expect(config.root).to.eql(Fs.cwd());
      expect(config.base).to.eql('./');
      expect(includesPlugin(config, 'vite-plugin-wasm')).to.be.true;
      expect(includesPlugin(config, 'vite:react-swc')).to.be.true;
    });

    it('no plugins', async () => {
      const config = await ViteConfig.app({ plugins: { wasm: false, react: false } });
      expect(config.plugins).to.eql([]);
    });
  });
});
