import { describe, expect, it } from '../../../-test.ts';
import { Profiles } from '../mod.ts';

describe(`@sys/driver-pi/cli/Profiles/m.main`, () => {
  it('API', () => {
    expect(Profiles.main).to.be.a('function');
  });
});
