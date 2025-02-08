import { type t, describe, it, expect } from '../../-test.ts';
import { Testing, Path, Fs } from './mod.ts';

describe('Testing.dir', () => {
  it('create: slug (default)', async () => {
    const a = Testing.dir('foo');
    const b = Testing.dir('foo', { slug: false });
    expect(a.dir).to.include('.tmp/test/foo/');
    expect(b.dir).to.include('.tmp/test/foo');
  });

  describe('exists', () => {
    it('exists: root', async () => {
      const dir = Testing.dir('foo');
      expect(await dir.exists()).to.eql(false);
      await dir.create();
      expect(await dir.exists()).to.eql(true);
    });

    it('exists: subpath', async () => {
      const fs = await Testing.dir('foo').create();
      expect(await fs.exists()).to.eql(true);
      expect(await fs.exists('foo/bar')).to.eql(false);

      await Fs.writeJson(Path.join(fs.dir, 'foo/bar'), { foo: 123 });
      expect(await fs.exists('foo', 'bar')).to.eql(true);
    });
  });

  describe('join', () => {
    it('root', () => {
      const fs = Testing.dir('foo');
      expect(fs.join()).to.eql(fs.dir);
    });

    it('sub-path', () => {
      const fs = Testing.dir('foo');
      expect(fs.join('foo', 'bar/zoo')).to.eql(Path.join(fs.dir, 'foo/bar/zoo'));
    });
  });

  describe('ls', () => {
    it('empty', async () => {
      const fs = Testing.dir('foo');
      expect(await fs.ls()).to.eql([]);
      expect(await fs.ls(true)).to.eql([]);
      await fs.create();
      expect(await fs.ls()).to.eql([]);
    });

    it('paths (absolute)', async () => {
      const fs = Testing.dir('foo');
      await Fs.writeJson(Path.join(fs.dir, 'foo.json'), { foo: 123 });
      await Fs.writeJson(Path.join(fs.dir, 'foo/bar.json'), { foo: 456 });

      const paths = await fs.ls();
      expect(paths.every((p) => Path.Is.absolute(p))).to.eql(true);
      expect(paths[0].endsWith('/foo.json')).to.eql(true);
      expect(paths[1].endsWith('/foo/bar.json')).to.eql(true);
    });

    it('paths (relative) ← root directory trimmed', async () => {
      const fs = Testing.dir('foo');
      await Fs.writeJson(Path.join(fs.dir, 'foo.json'), { foo: 123 });
      await Fs.writeJson(Path.join(fs.dir, 'foo/bar.json'), { foo: 456 });

      const trimRoot = true;
      const paths = await fs.ls(trimRoot);
      expect(paths.every((p) => Path.Is.relative(p))).to.eql(true);
      expect(paths[0]).to.eql('foo.json');
      expect(paths[1]).to.eql('foo/bar.json');
    });
  });
});
