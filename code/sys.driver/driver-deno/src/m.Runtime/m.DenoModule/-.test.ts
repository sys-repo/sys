import { describe, expect, it } from '../../-test.ts';
import { DenoModule } from './mod.ts';
import { backup } from './u.backup.ts';
import { upgrade } from './u.upgrade.ts';

describe('DenoModule', () => {
  it('API', async () => {
    expect(DenoModule.upgrade).to.equal(upgrade);
    expect(DenoModule.backup).to.equal(backup);
  });
});
