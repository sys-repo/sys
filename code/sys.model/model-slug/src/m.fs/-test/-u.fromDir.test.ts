import { type t, describe, expect, it, Str } from '../../-test.ts';
import { Fs } from '../common.ts';
import { fromDir } from '../mod.ts';

describe('SlugTreeFs.fromDir', () => {
  async function assertReadmeIndex(readmeName: 'README.md' | '-README.md') {
    const dir = await Fs.makeTempDir();
    try {
      const root = Fs.join(dir.absolute, 'root');
      const libDir = Fs.join(root, 'lib');
      await Fs.ensureDir(libDir);

      await Fs.write(Fs.join(libDir, readmeName), '# Lib\n');
      await Fs.write(
        Fs.join(libDir, 'child.md'),
        Str.dedent(
          `
          ---
          ref: crdt:child-1
          ---

          # Child
        `,
        ).trimStart(),
      );

      let count = 0;
      const createCrdt = async () => {
        count += 1;
        return `crdt:lib-${count}` as t.StringRef;
      };

      const doc = await fromDir({ root, createCrdt });
      const tree = doc.tree;

      expect(tree.length).to.eql(1);
      const lib = tree[0];
      expect(lib.slug).to.eql('lib');
      expect('ref' in lib).to.eql(true);
      if (!('ref' in lib)) return;
      expect(lib.ref).to.eql('crdt:lib-2');
      expect(Array.isArray(lib.slugs)).to.eql(true);
      expect(lib.slugs?.length).to.eql(1);
      expect(lib.slugs?.[0].slug).to.eql('child');
      if ('ref' in (lib.slugs?.[0] ?? {})) {
        expect((lib.slugs?.[0] as t.SlugTreeItemRefOnly).ref).to.eql('crdt:child-1');
      }
      expect(count).to.eql(2);
    } finally {
      await Fs.remove(dir.absolute);
    }
  }

  it('does not inject or mutate when createCrdt is not provided', async () => {
    const dir = await Fs.makeTempDir();
    try {
      const root = Fs.join(dir.absolute, 'root');
      await Fs.ensureDir(root);

      const filePath = Fs.join(root, 'alpha.md');
      await Fs.write(filePath, '# Alpha\n');

      const doc = await fromDir({ root });
      const tree = doc.tree;

      expect(tree.length).to.eql(1);
      expect(tree[0].slug).to.eql('alpha');
      expect('ref' in tree[0]).to.eql(false);

      const after = (await Fs.readText(filePath)).data ?? '';
      expect(after).to.eql('# Alpha\n');
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('uses README.md as directory index and keeps children', async () => {
    await assertReadmeIndex('README.md');
  });

  it('treats -README.md as directory index alias', async () => {
    await assertReadmeIndex('-README.md');
  });
});
