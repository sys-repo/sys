import { Path as StdPath } from '@sys/std';
import { describe, expect, it } from '../-test.ts';
import { Fs, Path } from './mod.ts';

describe('Fs.Path', () => {
  it('refs', () => {
    expect(Fs.Path).to.equal(Path);
    expect(Fs.Path).to.not.equal(StdPath);
    expect(Fs.join).to.eql(Path.join);
    expect(Fs.resolve).to.eql(Path.resolve);
    expect(Fs.dirname).to.eql(Path.dirname);
    expect(Fs.basename).to.eql(Path.basename);
  });

  it('asDir', async () => {
    const path1 = Path.resolve('.');
    const path2 = Path.resolve('./deno.json');
    const path3 = Path.resolve('./404.json');

    const res1 = await Fs.Path.asDir(path1);
    const res2 = await Fs.Path.asDir(path2);
    const res3 = await Fs.Path.asDir(path3);

    expect(res1).to.eql(path1);
    expect(res2).to.eql(path1); // NB: stepped up to parent.
    expect(res3).to.eql(path3); // NB: not-found, no change.
  });

  it('Fs.resolve', () => {
    const path1 = Path.resolve('.');
    const path2 = Path.resolve(path1);
    expect(Path.Is.absolute(path1)).to.eql(true);
    expect(path1).to.eql(path2); // NB: does not alter an already absolute path.
  });

  it('Fs.Path.cwd', () => {
    expect(Fs.Path.cwd()).to.eql(Deno.cwd());
    expect(Fs.cwd()).to.eql(Fs.Path.cwd());
  });

  describe('trimCwd ← "current working directory"', () => {
    it('invalid input', () => {
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => {
        expect(Fs.Path.trimCwd(v)).to.eql('');
      });
    });

    it('trims CWD', () => {
      const cwd = Deno.cwd();
      const path = Path.join(cwd, 'foo/bar');
      const a = Path.trimCwd(path);
      const b = Path.trimCwd(path, true);
      expect(a).to.eql('foo/bar');
      expect(b).to.eql('./foo/bar');
    });

    it('no change: not an absolute path', () => {
      expect(Path.trimCwd('foo/bar')).to.eql('foo/bar');
      expect(Path.trimCwd('./foo/bar')).to.eql('foo/bar');
      expect(Path.trimCwd('./foo/bar', { prefix: true })).to.eql('./foo/bar');
    });

    it('no change: absolute path differs from CWD', () => {
      expect(Path.trimCwd('/foo/bar')).to.eql('/foo/bar');
    });

    it('param: {cwd} ', () => {
      const a = Path.trimCwd('/foo/bar', { cwd: '/foo' });
      const b = Path.trimCwd('/foo/bar', { cwd: '/foo', prefix: true });
      const c = Path.trimCwd('/foo/bar', { cwd: '/abc' });
      expect(a).to.eql('bar');
      expect(b).to.eql('./bar');
      expect(c).to.eql('/foo/bar');
    });

    it('param: {prefix}', () => {
      const a = Path.trimCwd('./foo/bar'); // NB: default (false).
      const b = Path.trimCwd('./foo/bar', { prefix: false });
      const c = Path.trimCwd('foo/bar', { prefix: true });
      const d = Path.trimCwd('foo/bar', true);
      expect(a).to.eql('foo/bar');
      expect(b).to.eql('foo/bar');
      expect(c).to.eql('./foo/bar');
      expect(d).to.eql('./foo/bar');
    });
  });
});
