import { describe, expect, it } from '../../../-test.ts';
import { Cli } from '../../mod.ts';

describe('Cli.Fmt.Tree', () => {
  const T = Cli.Fmt.Tree;

  it('exports glyph primitives', () => {
    expect(T.vert).to.eql('│');
    expect(T.mid).to.eql('├');
    expect(T.last).to.eql('└');
    expect(T.bar).to.eql('─');
  });

  it('branch(boolean): mid/last + single bar', () => {
    expect(T.branch(false)).to.eql(T.mid + T.bar);
    expect(T.branch(true)).to.eql(T.last + T.bar);
  });

  it('branch(tuple): equivalent to boolean form', () => {
    const items = [1, 2, 3];

    expect(T.branch([0, items])).to.eql(T.mid + T.bar);
    expect(T.branch([1, items])).to.eql(T.mid + T.bar);
    expect(T.branch([2, items])).to.eql(T.last + T.bar);
  });

  it('branch extend: repeats bar', () => {
    expect(T.branch(false, 3)).to.eql(T.mid + T.bar.repeat(3));
    expect(T.branch(true, 2)).to.eql(T.last + T.bar.repeat(2));
  });
});
