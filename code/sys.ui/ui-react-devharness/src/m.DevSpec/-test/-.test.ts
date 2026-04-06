import { describe, expect, it } from '../../-test.ts';
import { DevSpec } from '../mod.ts';

describe(`@sys/ui-react-devharness/spec`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-devharness/spec');
    expect(m.DevSpec).to.equal(DevSpec);
  });
});
