import { Path as StdPath } from '@sys/std';
import { describe, expect, it } from '../../-test.ts';
import { Path } from '../common.ts';
import { Fs } from '../mod.ts';

describe('Fs.Path', () => {
  it('refs', () => {
    expect(Fs.Path).to.equal(Path);
    expect(Fs.Path).to.not.equal(StdPath);
    expect(Fs.join).to.eql(Path.join);
    expect(Fs.resolve).to.not.equal(Path.resolve);
    expect(Fs.resolve('foo/bar')).to.eql(Path.resolve('foo/bar'));
    expect(Fs.dirname).to.eql(Path.dirname);
    expect(Fs.basename).to.eql(Path.basename);
    expect(Fs.extname).to.eql(Path.extname);
  });

  describe('resolve', () => {
    const originalHome = Deno.env.get('HOME') ?? undefined;
    const restoreHome = () => {
      if (originalHome == null) {
        if (Deno.env.get('HOME') != null) Deno.env.delete('HOME');
      } else {
        Deno.env.set('HOME', originalHome);
      }
    };

    it('keeps default resolve semantics', () => {
      expect(Fs.resolve('~')).to.eql(Path.resolve('~'));
      expect(Fs.resolve('foo', 'bar')).to.eql(Path.resolve('foo', 'bar'));
    });

    it('respects explicit expandTilde: false', () => {
      Deno.env.set('HOME', '/Users/tester');
      expect(Fs.resolve('~', { expandTilde: false })).to.eql(Path.resolve('~'));
      restoreHome();
    });

    it('supports expandTilde: true', () => {
      Deno.env.set('HOME', '/Users/tester');
      expect(Fs.resolve('~', { expandTilde: true })).to.eql(Path.resolve('/Users/tester'));
      expect(Fs.resolve('~/foo', { expandTilde: true })).to.eql(Path.resolve('/Users/tester/foo'));
      restoreHome();
    });

    it('throws when non-option object is passed as a path segment', () => {
      expect(() => Fs.resolve('foo', { nope: true } as any)).to.throw(TypeError);
    });
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
});
