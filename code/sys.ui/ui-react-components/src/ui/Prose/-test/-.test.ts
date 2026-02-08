import { describe, expect, it } from '../../../-test.ts';
import { Prose } from '../mod.ts';

describe(`Prose`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components');
    expect(m.Prose).to.equal(Prose);
  });
});
