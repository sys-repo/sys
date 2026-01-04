import { describe, expect, it } from '../../-test.ts';
import { V, Value } from '../mod.ts';
import { toSchema } from '../u.toSchema.ts';

describe(`Recipe: core schema grammar layer`, () => {
  it('API', async () => {
    const m = await import('@sys/schema/recipe');
    expect(m.V).to.equal(V);
    expect(m.Value).to.equal(Value);
    expect(Value).to.equal(V);
    expect(m.toSchema).to.equal(toSchema);
  });
});
