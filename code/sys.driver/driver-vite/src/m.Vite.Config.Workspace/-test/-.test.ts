import { type t, describe, expect, Fs, it, ROOT, Testing } from '../../-test.ts';
import { ViteConfig } from '../../m.Vite.Config/mod.ts';
import { workspace } from '../mod.ts';

describe('ViteConfig.workspace', () => {
  it('API', () => {
    expect(ViteConfig.workspace).to.equal(workspace);
  });

  it('loads (via path)', async () => {
    const map = (children: t.DenoWorkspaceChild[]) => children.map((m) => m.path.dir);

    const a = await workspace(); // NB: finds root workspace
    const b = await workspace({ denofile: ROOT.denofile.path });
    const c = await workspace({ walkup: false });

    expect(a.exists).to.eql(true);
    expect(b.exists).to.eql(true);
    expect(map(a.children).includes('code/sys/std')).to.eql(true);
    expect(map(a.children)).to.eql(map(b.children));
    expect(c.exists).to.eql(false); // NB: did not walk up to the root workspace `deno.json`
    expect(c.error).to.eql('Workspace not found (walkup=false).');
  });

  describe('resolution {aliases}', () => {
    it('generate {aliases} list', async () => {
      const ws = await workspace();
      const map = ws.toAliasMap();
      const lookup = {
        key: '@sys/std/args',
        path: ROOT.resolve('./code/sys/std/src/m.Args/mod.ts'),
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

    it('loads from jsonc workspace file', async () => {
      const fs = await Testing.dir('ViteConfig.workspace.jsonc').create();
      const root = fs.dir;
      const childDir = Fs.join(root, 'pkg-a');
      const childSrc = Fs.join(childDir, 'src');

      await Fs.ensureDir(childSrc);
      await Fs.write(Fs.join(childSrc, 'mod.ts'), 'export const ok = true;');
      await Fs.write(
        Fs.join(childDir, 'deno.json'),
        JSON.stringify(
          {
            name: '@sys/pkg-a',
            version: '0.0.0',
            exports: {
              './mod': './src/mod.ts',
            },
          },
          null,
          2,
        ),
      );
      await Fs.write(
        Fs.join(root, 'deno.jsonc'),
        `{
          // comment
          "name": "root",
          "version": "0.0.0",
          "workspace": ["pkg-a"]
        }`,
      );

      const ws = await workspace({ denofile: Fs.join(root, 'deno.jsonc'), walkup: false });
      const match = ws.aliases.find((item) => item.find === '@sys/pkg-a/mod');
      expect(ws.exists).to.eql(true);
      expect(match?.replacement).to.eql(Fs.join(childDir, 'src/mod.ts'));
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
