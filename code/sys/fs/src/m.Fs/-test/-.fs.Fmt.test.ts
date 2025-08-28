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

      const out = await Fs.Fmt.treeFromDir(tmp.absolute as any);
      expect(out).to.include('a/');
      expect(out).to.include('c.txt');
      expect(out).to.include('z/');
      await Fs.remove(tmp.absolute);
    });
  });
});
