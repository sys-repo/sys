import { describe, expect, it } from '../../-test.ts';
import { Path } from '../common.ts';
import { Fs } from '../mod.ts';

describe('Fs.Fmt', () => {
  describe('Fmt.tree', () => {
    it('renders from path list', () => {
      const out = Fs.Fmt.tree(['a/b/c.txt', 'a/b/d.txt', 'a/e.txt', 'z/q.png'], { label: 'root/' });
      expect(out.split('\n')[0]).to.eql('root/');
      expect(out).to.include('a/');
      expect(out).to.include('z/');
      expect(out).to.include('c.txt');
    });

    it('renders from dir walk', async () => {
      const tmp = await Fs.makeTempDir({ prefix: 'fmt-tree-' });
      const a = Path.join(tmp.absolute, 'a/b/c.txt');
      const z = Path.join(tmp.absolute, 'z/q.png');
      await Fs.write(a, 'hi', { force: true });
      await Fs.write(z, new Uint8Array([1, 2, 3]), { force: true });

      const out = await Fs.Fmt.treeFromDir(tmp.absolute);
      expect(out).to.include('a/');
      expect(out).to.include('c.txt');
      expect(out).to.include('z/');
      await Fs.remove(tmp.absolute);

      console.info();
      console.info(out);
      console.info();
    });

    describe('indented', () => {
      it('left-pads every rendered line by the given number of spaces', () => {
        const rels = ['a/b/c.txt', 'a/b/d.txt', 'a/e.txt', 'z/q.png'];

        const out0 = Fs.Fmt.tree(rels, { label: 'root/', indent: 0 });
        const out4 = Fs.Fmt.tree(rels, { label: 'root/', indent: 4 });
        const out2 = Fs.Fmt.tree(rels, { label: 'root/', indent: 2 });

        const lines0 = out0.split('\n');
        const lines4 = out4.split('\n');
        const lines2 = out2.split('\n');

        // same number of lines
        expect(lines4.length).to.eql(lines0.length);
        expect(lines2.length).to.eql(lines0.length);

        // each corresponding line is prefixed by N spaces
        const prefix = (s: string, n: number) => ' '.repeat(n) + s;

        for (let i = 0; i < lines0.length; i++) {
          expect(lines4[i]).to.eql(prefix(lines0[i], 4));
          expect(lines2[i]).to.eql(prefix(lines0[i], 2));
        }

        console.info(`\n${out4}\n`);
      });

      it('works with maxDepth and no label', () => {
        const rels = ['a/b/c.txt', 'a/x/y.md', 'z/q.png'];

        const out = Fs.Fmt.tree(rels, { indent: 3, maxDepth: 1 });
        const lines = out.split('\n');

        // all lines should start with 3 spaces
        lines.forEach((line) => expect(line.startsWith('   ')).to.eql(true));

        // depth 1 means only top-level entries ('a/' and 'z/') plus possibly files at root (none here)
        // ensure no nested file names appear
        expect(lines.some((l) => /c\.txt|y\.md|q\.png/.test(l))).to.eql(false);
      });
    });
  });
});
