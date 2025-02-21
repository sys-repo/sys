import { type t, describe, expect, Fs, it, ROOT } from '../-test.ts';
import { ViteConfig } from '../m.Vite.Config/mod.ts';
import { workspace } from './mod.ts';

describe('ViteConfig.workspace', () => {
  it('API', () => {
    expect(ViteConfig.workspace).to.equal(workspace);
  });

  it('loads (via path)', async () => {
    const map = (children: t.DenoWorkspaceChild[]) => children.map((m) => Fs.dirname(m.path));

    const a = await workspace(); // NB: finds root workspace
    const b = await workspace({ denofile: ROOT.denofile.path });
    const c = await workspace({ walkup: false });

    expect(a.exists).to.eql(true);
    expect(b.exists).to.eql(true);
    expect(map(a.children).includes('code/sys/std')).to.eql(true);
    expect(map(a.children)).to.eql(map(b.children));
    expect(c.exists).to.eql(false); // NB: did not walk up to the root workspace `deno.json`
  });

  describe('resolution {aliases}', () => {
    it('generate {aliases} list', async () => {
      const ws = await workspace();
      const map = ws.toAliasMap();
      const lookup = {
        key: '@sys/tmp/ui',
        path: ROOT.resolve('./code/sys.tmp/src/ui/mod.ts'),
      };

      const match = ws.aliases.find((item) => item.find === lookup.key);
      expect(match?.replacement).to.eql(lookup.path);
      expect(map[lookup.key]).to.eql(lookup.path);
    });

    it('filter {aliases} list', async () => {
      const ws = await workspace({ filter: (e) => e.subpath.includes('/client') });
      const includesClient = (input: string) => input.includes('/client');
      const isOnlyClients = ws.aliases.every((item) => includesClient(String(item.find)));
      expect(isOnlyClients).to.eql(true);
    });

    it('all files exist', async () => {
      const ws = await workspace();
      for (const alias of ws.aliases) {
        const exists = await Fs.exists(alias.replacement);
        expect(exists).to.eql(true, alias.replacement);
      }
    });
  });
});
