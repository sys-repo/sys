import { type t, Fs, describe, expect, it, ROOT } from '../-test.ts';
import { ViteConfig } from './mod.ts';

describe('ViteConfig.workspace', () => {
  it('loads (via path)', async () => {
    const a = await ViteConfig.workspace(); // NB: finds root workspace
    const b = await ViteConfig.workspace({ denofile: ROOT.denofile.path });
    const c = await ViteConfig.workspace({ walkup: false });

    expect(a.exists).to.eql(true);
    expect(b.exists).to.eql(true);
    expect(a.paths.includes('./code/sys/std')).to.eql(true);
    expect(a.paths).to.eql(b.paths);
    expect(c.exists).to.eql(false); // NB: did not walk up to the root workspace `deno.json`
  });

  describe('resolution {aliases}', () => {
    it('generate {aliases} list', async () => {
      const ws = await ViteConfig.workspace();
      const map = ws.toAliasMap();
      const lookup = {
        key: '@sys/tmp/client/ui',
        path: ROOT.resolve('./code/sys.tmp/src/ui/mod.ts'),
      };

      const match = ws.aliases.find((item) => item.find === lookup.key);
      expect(match?.replacement).to.eql(lookup.path);
      expect(map[lookup.key]).to.eql(lookup.path);
    });

    it('filter {aliases} list', async () => {
      const ws = await ViteConfig.workspace({ filter: (e) => e.subpath.startsWith('/client') });
      const includesClient = (input: string) => input.includes('/client/');
      const isOnlyClients = ws.aliases.every((item) => includesClient(String(item.find)));
      expect(isOnlyClients).to.eql(true);
    });

    it('all files exist', async () => {
      const ws = await ViteConfig.workspace();
      for (const alias of ws.aliases) {
        const exists = await Fs.exists(alias.replacement);
        expect(exists).to.eql(true, alias.replacement);
      }
    });
  });
});
