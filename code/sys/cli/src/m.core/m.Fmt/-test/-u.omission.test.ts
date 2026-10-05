import { c, describe, expect, it } from '../../../-test.ts';
import { Cli, Fmt } from '../../mod.ts';

describe('Cli.Fmt.omission', () => {
  it('formats formatter-inserted omission markers as dim gray structural context', () => {
    expect(Fmt.omission()).to.eql(c.dim(c.gray('…')));
    expect(Fmt.omission('...')).to.eql(c.dim(c.gray('...')));
    expect(Fmt.omission('')).to.eql('');
    expect(Cli.Fmt.omission()).to.eql(Fmt.omission());
  });
});
