import { describe, expect, it } from '../../-test.ts';
import { Import } from './mod.ts';

describe('Jsr.Import', () => {
  it('specifier( pkg, version ) → package root', () => {
    expect(Import.specifier('@sys/std', '0.0.319')).to.eql('jsr:@sys/std@0.0.319');
  });

  it('specifier( pkg, version, "" ) → same as omitted suffix', () => {
    const a = Import.specifier('@sys/std', '0.0.319');
    const b = Import.specifier('@sys/std', '0.0.319', '');
    expect(b).to.eql(a);
  });

  it('specifier( pkg, version, suffix ) → appends suffix verbatim', () => {
    expect(Import.specifier('@sys/std', '0.0.319', '/async')).to.eql('jsr:@sys/std@0.0.319/async');
  });
});
