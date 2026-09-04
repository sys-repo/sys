import { describe, expectError, it } from '../../-test.ts';
import { TmplTesting } from '../mod.ts';

describe('m.testing/LocalRepoFixture', () => {
  it('create → dryRun requested → throw', async () => {
    await expectError(
      () => TmplTesting.LocalRepoFixture.create({ dryRun: true }),
      'does not support dryRun',
    );
  });
});
