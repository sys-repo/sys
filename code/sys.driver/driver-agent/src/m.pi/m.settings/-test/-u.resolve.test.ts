import { describe, expect, it } from '../../../-test.ts';
import { resolve } from '../u.resolve.ts';

describe(`@sys/driver-agent/pi/settings/u.resolve`, () => {
  it('resolve → returns deterministic wrapper-owned defaults', () => {
    expect(resolve()).to.eql({
      quietStartup: true,
      collapseChangelog: true,
    });
  });

  it('resolve → merges explicit overrides over defaults', () => {
    expect(resolve({ collapseChangelog: false })).to.eql({
      quietStartup: true,
      collapseChangelog: false,
    });
  });
});
