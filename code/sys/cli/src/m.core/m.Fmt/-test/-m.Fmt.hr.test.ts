import { describe, expect, it } from '../../../-test.ts';
import { c, Fmt } from '../../mod.ts';

describe('Cli.Fmt.hr', () => {
  it('returns a plain rule by default', () => {
    expect(Fmt.hr()).to.eql('━'.repeat(84));
  });

  it('accepts width only', () => {
    expect(Fmt.hr(6)).to.eql('━'.repeat(6));
  });

  it('accepts color only', () => {
    expect(Fmt.hr('green')).to.eql(c.green('━'.repeat(84)));
  });

  it('accepts width and color', () => {
    expect(Fmt.hr(6, 'cyan')).to.eql(c.cyan('━'.repeat(6)));
  });
});
