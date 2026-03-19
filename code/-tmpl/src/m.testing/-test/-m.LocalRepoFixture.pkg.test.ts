import { describe, expect, Fs, it } from '../../-test.ts';
import { TmplTesting } from '../mod.ts';
import { runRepoCi, writePkg } from './u.fixture.ts';

describe('m.testing/LocalRepoFixture/pkg', () => {
  it('create → add pkg → rewrite → repo ci passes', async () => {
    const fixture = await TmplTesting.LocalRepoFixture.create();
    const pkgDir = await writePkg(fixture.root);
    await TmplTesting.LocalRepoAuthorities.rewrite({ root: fixture.root });

    expect(await Fs.exists(Fs.join(pkgDir, '-scripts', 'task.deploy.ts'))).to.eql(true);
    const denoJson = await Fs.readJson<{ readonly tasks?: Record<string, string> }>(Fs.join(pkgDir, 'deno.json'));
    expect(denoJson.data?.tasks?.deploy).to.eql('deno run -P=deploy ./-scripts/task.deploy.ts');

    const ci = await runRepoCi(fixture.root);
    if (!ci.success) {
      throw new Error(
        `Localized repo fixture pkg ci failed (code ${ci.code}).\n\nstdout:\n${ci.text.stdout}\n\nstderr:\n${ci.text.stderr}`,
      );
    }
  });
});
