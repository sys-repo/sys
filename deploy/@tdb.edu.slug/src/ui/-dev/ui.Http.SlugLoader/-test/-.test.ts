import { describe, expect, it } from '../../../../-test.ts';
import { ActionProbe } from '../mod.ts';

describe('ActionProbe', () => {
  it('API', async () => {
    expect(ActionProbe.signals).to.equal(ActionProbe.Signals.create);
  });
});
