import { describe, expect, it } from '../../../-test.ts';
import { Jsr } from '../mod.ts';

describe('Jsr (client)', () => {
  it('validates JSR package names', () => {
    expect(Jsr.Is.pkgName('@scope/pkg')).to.eql(true);
    expect(Jsr.Is.pkgName('@sys/workspace')).to.eql(true);
    expect(Jsr.Is.pkgName('@scope/pkg-name')).to.eql(true);
    expect(Jsr.Is.pkgName('pkg')).to.eql(false);
    expect(Jsr.Is.pkgName('@scope')).to.eql(false);
    expect(Jsr.Is.pkgName('@Scope/pkg')).to.eql(false);
    expect(Jsr.Is.pkgName('@scope/pkg.name')).to.eql(false);
  });
});
