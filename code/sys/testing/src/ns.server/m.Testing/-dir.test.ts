import { type t, describe, it, expect } from '../../-test.ts';
import { Testing, Path, Fs } from './mod.ts';

describe('Testing.dir', () => {
  it('create: os-temp (default)', async () => {
    const a = Testing.dir('foo');
    expect(() => a.dir).to.throw();
    const created = await a.create();
    expect(created.dir).to.not.eql('');
    expect(created.dir.includes('/.tmp/test/foo')).to.eql(false);
  });

  it('create: local-temp', () => {
    const a = Testing.dir('foo', { location: 'local-temp' });
    const b = Testing.dir('foo', { location: 'local-temp', slug: false });
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
    it('root', async () => {
      const fs = await Testing.dir('foo').create();
      expect(fs.join()).to.eql(fs.dir);
    });

    it('sub-path', async () => {
      const fs = await Testing.dir('foo').create();
      expect(fs.join('foo', 'bar/zoo')).to.eql(Path.join(fs.dir, 'foo/bar/zoo'));
    });
  });

  describe('ls', () => {
    it('empty', async () => {
      const fs = await Testing.dir('foo').create();
      expect(await fs.ls()).to.eql([]);
      expect(await fs.ls(true)).to.eql([]);
      expect(await fs.ls()).to.eql([]);
    });

    it('paths (absolute)', async () => {
      const fs = await Testing.dir('foo').create();
      await Fs.writeJson(Path.join(fs.dir, 'foo.json'), { foo: 123 });
      await Fs.writeJson(Path.join(fs.dir, 'foo/bar.json'), { foo: 456 });

      const paths = await fs.ls();
      expect(paths.every((p) => Path.Is.absolute(p))).to.eql(true);
      expect(paths[0].endsWith('/foo.json')).to.eql(true);
      expect(paths[1].endsWith('/foo/bar.json')).to.eql(true);
    });

    it('paths (relative) ← root directory trimmed', async () => {
      const fs = await Testing.dir('foo').create();
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
