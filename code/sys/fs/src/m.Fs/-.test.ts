import { Path as StdPath } from '@sys/std';
import { describe, expect, it } from '../-test.ts';
import { Glob } from '../m.Glob/mod.ts';
import { Path } from './common.ts';
import { Fs } from './mod.ts';

describe('Fs: filesystem', () => {
  it('API', () => {
    expect(Fs.glob).to.equal(Glob.create);
    expect(Fs.ls).to.equal(Glob.ls);
  });

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
  });
});
