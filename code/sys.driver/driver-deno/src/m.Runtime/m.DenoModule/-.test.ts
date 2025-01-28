import { type t, describe, it, expect, Testing } from '../../-test.ts';
import { DenoModule } from './mod.ts';
import { upgrade } from './u.upgrade.ts';

describe('DenoModule', () => {
  it('API', async () => {
    expect(DenoModule.upgrade).to.equal(upgrade);
  });
});
