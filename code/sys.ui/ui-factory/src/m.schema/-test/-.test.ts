import { describe, expect, it } from '../../-test.ts';
import { Schema } from '../mod.ts';

describe('Factory: Schema', () => {
  it('API', async () => {
    const m = await import('@sys/ui-factory/schema');
    expect(m.Schema).to.equal(Schema);
  });
});
