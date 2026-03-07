import { describe, expect, it } from '../../-test.ts';

import { Filter } from '../mod.ts';

describe(`Filter`, () => {
  it('API', async () => {
    const m = await import('@sys/text/filter');
    expect(m.Filter).to.equal(Filter);
  });
});
