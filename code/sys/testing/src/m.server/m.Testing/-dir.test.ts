import { type t, describe, it, expect } from '../../-test.ts';
import { Testing, Path, Fs } from './mod.ts';

describe('Testing.dir', () => {
  it('creates: os-temp (default)', async () => {
    const fs = await Testing.dir('foo');
    expect(fs.dir).to.not.eql('');
    expect(fs.dir.includes('/.tmp/test/foo')).to.eql(false);
    expect(await fs.exists()).to.eql(true);
    expect(Path.basename(fs.dir).startsWith('foo-')).to.eql(true);
    expect('create' in fs).to.eql(false);
  });

  it('creates: os-temp (slug false) ← preserves dirname prefix', async () => {
    const fs = await Testing.dir('foo', { slug: false });
    expect(Path.basename(fs.dir).startsWith('foo-')).to.eql(true);
  });

  it('creates: local-temp', async () => {
    const a = await Testing.dir('foo', { location: 'local-temp' });
    const b = await Testing.dir('foo', { location: 'local-temp', slug: false });
    expect(a.dir).to.include('.tmp/test/foo/');
    expect(b.dir).to.include('.tmp/test/foo');
  });

  describe('exists', () => {
    it('exists: root', async () => {
      const dir = await Testing.dir('foo');
      expect(await dir.exists()).to.eql(true);
    });

    it('exists: subpath', async () => {
      const fs = await Testing.dir('foo');
      expect(await fs.exists()).to.eql(true);
      expect(await fs.exists('foo/bar')).to.eql(false);

      await Fs.writeJson(Path.join(fs.dir, 'foo/bar'), { foo: 123 });
      expect(await fs.exists('foo', 'bar')).to.eql(true);
    });
  });

  describe('join', () => {
    it('root', async () => {
      const fs = await Testing.dir('foo');
      expect(fs.join()).to.eql(fs.dir);
    });

    it('sub-path', async () => {
      const fs = await Testing.dir('foo');
      expect(fs.join('foo', 'bar/zoo')).to.eql(Path.join(fs.dir, 'foo/bar/zoo'));
    });
  });

  describe('ls', () => {
    it('empty', async () => {
      const fs = await Testing.dir('foo');
      expect(await fs.ls()).to.eql([]);
      expect(await fs.ls(true)).to.eql([]);
      expect(await fs.ls()).to.eql([]);
    });

    it('paths (absolute)', async () => {
      const fs = await Testing.dir('foo');
      await Fs.writeJson(Path.join(fs.dir, 'foo.json'), { foo: 123 });
      await Fs.writeJson(Path.join(fs.dir, 'foo/bar.json'), { foo: 456 });

      const paths = await fs.ls();
      expect(paths.every((p) => Path.Is.absolute(p))).to.eql(true);
      expect(paths[0].endsWith('/foo.json')).to.eql(true);
      expect(paths[1].endsWith('/foo/bar.json')).to.eql(true);
    });

    it('paths (relative) ← root directory trimmed', async () => {
      const fs = await Testing.dir('foo');
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
