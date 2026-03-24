import { describe, expect, it } from '../../../-test.ts';
import { c, Cli, Fmt } from '../../mod.ts';

describe('CLI: core / m.Fmt', () => {
  it('API: Fmt (Format)', async () => {
    const m = await import('@sys/cli/fmt');
    expect(m.Fmt).to.equal(Fmt);
    expect(m.Fmt).to.equal(Cli.Fmt);
  });

  describe('Fmt.hr', () => {
    it('returns a plain rule by default', () => {
      expect(Fmt.hr()).to.equal('━'.repeat(84));
    });

    it('accepts width only', () => {
      expect(Fmt.hr(6)).to.equal('━'.repeat(6));
    });

    it('accepts color only', () => {
      expect(Fmt.hr('green')).to.equal(c.green('━'.repeat(84)));
    });

    it('accepts width and color', () => {
      expect(Fmt.hr(6, 'cyan')).to.equal(c.cyan('━'.repeat(6)));
    });
  });

  describe('Fmt.Tree', () => {
    const T = Cli.Fmt.Tree;

    it('exports glyph primitives', () => {
      expect(T.vert).to.equal('│');
      expect(T.mid).to.equal('├');
      expect(T.last).to.equal('└');
      expect(T.bar).to.equal('─');
    });

    it('branch(boolean): mid/last + single bar', () => {
      expect(T.branch(false)).to.equal(T.mid + T.bar);
      expect(T.branch(true)).to.equal(T.last + T.bar);
    });

    it('branch(tuple): equivalent to boolean form', () => {
      const items = [1, 2, 3];

      expect(T.branch([0, items])).to.equal(T.mid + T.bar);
      expect(T.branch([1, items])).to.equal(T.mid + T.bar);
      expect(T.branch([2, items])).to.equal(T.last + T.bar);
    });

    it('branch extend: repeats bar', () => {
      expect(T.branch(false, 3)).to.equal(T.mid + T.bar.repeat(3));
      expect(T.branch(true, 2)).to.equal(T.last + T.bar.repeat(2));
    });
  });

  describe('Fmt.Path', () => {
    it('Path.str: gray path with white basename', () => {
      const path = 'foo/bar/a.ts';

      const inner = Fmt.path(path, Fmt.Path.fmt());
      expect(inner).to.eql(`foo/bar/${c.white('a.ts')}`);

      const res = Fmt.Path.str(path);
      expect(res).to.eql(c.gray(inner));
    });
  });
});
