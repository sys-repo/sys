import { describe, expect, it } from '../../../-test.ts';
import { Npm } from '../mod.ts';

describe('@sys/registry/npm (client)', () => {
  it('validates npm package names', () => {
    expect(Npm.Is.pkgName('react')).to.eql(true);
    expect(Npm.Is.pkgName('@scope/pkg')).to.eql(true);
    expect(Npm.Is.pkgName('@scope/pkg.name')).to.eql(true);
    expect(Npm.Is.pkgName('@scope/pkg_name')).to.eql(true);
    expect(Npm.Is.pkgName('@Scope/pkg')).to.eql(false);
    expect(Npm.Is.pkgName('@scope')).to.eql(false);
    expect(Npm.Is.pkgName('.pkg')).to.eql(false);
  });
});
