import { describe, expect, it } from '../../../-test.ts';
import { KeyValue } from '../../KeyValue/mod.ts';
import { Switches } from '../mod.ts';

describe('KeyValue.Switches', () => {
  it('API', async () => {
    const m = await import('@sys/ui-components/react/key-value');
    expect(m.KeyValue).to.equal(KeyValue);
    expect(m.KeyValue.Switches).to.equal(Switches);
  });
});
