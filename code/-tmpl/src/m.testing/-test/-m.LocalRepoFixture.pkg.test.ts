import { describe, it } from '../../-test.ts';
import { TmplTesting } from '../mod.ts';
import { runRepoCi, writePkg } from './u.fixture.ts';

describe('m.testing/LocalRepoFixture/pkg', () => {
  it('create → add pkg → rewrite → repo ci passes', async () => {
    const fixture = await TmplTesting.LocalRepoFixture.create();
    await writePkg(fixture.root);
    await TmplTesting.LocalRepoAuthorities.rewrite({ root: fixture.root });

    const ci = await runRepoCi(fixture.root);
    if (!ci.success) {
      throw new Error(
        `Localized repo fixture pkg ci failed (code ${ci.code}).\n\nstdout:\n${ci.text.stdout}\n\nstderr:\n${ci.text.stderr}`,
      );
    }
  });
});
