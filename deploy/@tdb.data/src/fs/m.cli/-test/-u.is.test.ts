import { describe, expect, it } from '../../../-test.ts';
import { MountName } from '../u.is.ts';

describe('MountName', () => {
  it('accepts canonical mount names', () => {
    expect(MountName.test('sample-1')).to.eql(true);
    expect(MountName.test('foo_bar')).to.eql(true);
    expect(MountName.test('v1.thing')).to.eql(true);
  });

  it('rejects invalid mount names', () => {
    expect(MountName.test('bad/mount')).to.eql(false);
    expect(MountName.test('bad space')).to.eql(false);
    expect(MountName.test('-bad')).to.eql(false);
  });
});
