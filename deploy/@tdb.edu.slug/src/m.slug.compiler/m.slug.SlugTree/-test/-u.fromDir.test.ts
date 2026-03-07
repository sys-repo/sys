import { type t, describe, expect, it, Str } from '../../-test.ts';
import { fromDir } from '../u.fromDir.ts';
import { Fs } from '../common.ts';

describe('SlugTree.fromDir', () => {
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

  it('inserts front-matter ref when missing', async () => {
    const dir = await Fs.makeTempDir();
    try {
      const root = Fs.join(dir.absolute, 'root');
      await Fs.ensureDir(root);

      const filePath = Fs.join(root, 'alpha.md');
      await Fs.write(filePath, '# Alpha\n');

      let count = 0;
      const createCrdt = async () => {
        count += 1;
        return `crdt:alpha-${count}` as t.StringRef;
      };

      const doc = await fromDir({ root, createCrdt });
      const tree = doc.tree;

      expect(tree.length).to.eql(1);
      expect(tree[0].slug).to.eql('alpha');
      expect('ref' in tree[0]).to.eql(true);
      if ('ref' in tree[0]) {
        expect(tree[0].ref).to.eql('crdt:alpha-1');
      }

      const updated = (await Fs.readText(filePath)).data ?? '';
      expect(updated.startsWith('---\nref: crdt:alpha-1\n---\n')).to.eql(true);
      expect(updated).to.contain('# Alpha');
      expect(count).to.eql(1);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('treats blank createCrdt values as no-op', async () => {
    const dir = await Fs.makeTempDir();
    try {
      const root = Fs.join(dir.absolute, 'root');
      await Fs.ensureDir(root);

      const fileA = Fs.join(root, 'empty.md');
      await Fs.write(fileA, '# Empty\n');
      const fileB = Fs.join(root, 'none.md');
      await Fs.write(fileB, '# None\n');

      const blank = async () => '   ' as t.StringRef;
      const none = async () => undefined;

      const docA = await fromDir({ root, createCrdt: blank });
      expect(docA.tree.length).to.eql(2);
      expect(docA.tree.every((item) => !('ref' in item))).to.eql(true);

      const docB = await fromDir({ root, createCrdt: none });
      expect(docB.tree.length).to.eql(2);
      expect(docB.tree.every((item) => !('ref' in item))).to.eql(true);

      const afterA = (await Fs.readText(fileA)).data ?? '';
      const afterB = (await Fs.readText(fileB)).data ?? '';
      expect(afterA).to.eql('# Empty\n');
      expect(afterB).to.eql('# None\n');
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('adds ref to existing front-matter without overwriting', async () => {
    const dir = await Fs.makeTempDir();
    try {
      const root = Fs.join(dir.absolute, 'root');
      await Fs.ensureDir(root);

      const filePath = Fs.join(root, 'beta.md');
      await Fs.write(
        filePath,
        Str.dedent(
          `
          ---
          title: Beta
          ---

          # Beta
        `,
        ).trimStart(),
      );

      const createCrdt = async () => 'crdt:beta-1' as t.StringRef;
      const doc = await fromDir({ root, createCrdt });
      const tree = doc.tree;

      expect(tree.length).to.eql(1);
      expect(tree[0].slug).to.eql('beta');
      if ('ref' in tree[0]) {
        expect(tree[0].ref).to.eql('crdt:beta-1');
      }

      const updated = (await Fs.readText(filePath)).data ?? '';
      const frontmatter = updated.split('---')[1];
      expect(frontmatter.trim().startsWith('ref: crdt:beta-1')).to.eql(true);
      expect(frontmatter).to.contain('title: Beta');
      const refCount = frontmatter.split('\n').filter((line) => line.startsWith('ref:')).length;
      expect(refCount).to.eql(1);
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

  it('ignores dotfiles and node_modules', async () => {
    const dir = await Fs.makeTempDir();
    try {
      const root = Fs.join(dir.absolute, 'root');
      await Fs.ensureDir(root);
      await Fs.ensureDir(Fs.join(root, 'node_modules'));

      await Fs.write(Fs.join(root, '.hidden.md'), '# Hidden\n');
      await Fs.write(Fs.join(root, 'node_modules', 'pkg.md'), '# Pkg\n');
      await Fs.write(Fs.join(root, 'visible.md'), '# Visible\n');

      const createCrdt = async () => 'crdt:visible-1' as t.StringRef;
      const doc = await fromDir({ root, createCrdt });
      const tree = doc.tree;

      expect(tree.length).to.eql(1);
      expect(tree[0].slug).to.eql('visible');
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('sorts case-insensitively by slug', async () => {
    const dir = await Fs.makeTempDir();
    try {
      const root = Fs.join(dir.absolute, 'root');
      await Fs.ensureDir(root);

      await Fs.write(Fs.join(root, 'b.md'), '# b\n');
      await Fs.write(Fs.join(root, 'A.md'), '# A\n');

      let count = 0;
      const createCrdt = async () => {
        count += 1;
        return `crdt:${count}` as t.StringRef;
      };

      const doc = await fromDir({ root, createCrdt });
      const slugs = doc.tree.map((item) => item.slug);

      expect(slugs).to.eql(['A', 'b']);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });
});
