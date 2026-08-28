import { describe, expect, Fs, it, type t } from '../../-test.ts';

import { assertRunOk } from './u.fixture.run.ts';
import { buildGeneratedWorkspaceRepo } from './u.fixture.tmpl.ts';

describe('Vite external smoke (repo-generated workspace)', () => {
  it('build: generated tmpl.repo sibling packages compose through workspace imports', async () => {
    const { rootDir, fooDir, barDir, generateFoo, generateBar, patch, bootstrap, build } =
      await buildGeneratedWorkspaceRepo({
        sampleName: 'Vite.repo.generated.workspace',
      });

    assertRunOk(generateFoo, 'Generated foo project creation failed');
    assertRunOk(generateBar, 'Generated bar project creation failed');
    assertRunOk(patch, 'Generated workspace patch failed');
    assertRunOk(bootstrap, 'Generated workspace bootstrap failed');

    expect(await Fs.exists(Fs.join(fooDir, 'deno.json'))).to.eql(true);
    expect(await Fs.exists(Fs.join(barDir, 'deno.json'))).to.eql(true);

    const fooDeno = (await Fs.readJson<t.DenoFile.Json>(Fs.join(fooDir, 'deno.json'))).data;
    const barDeno = (await Fs.readJson<t.DenoFile.Json>(Fs.join(barDir, 'deno.json'))).data;
    expect(fooDeno?.name).to.eql('@tmp/foo');
    expect(barDeno?.name).to.eql('@tmp/bar');

    assertRunOk(build, 'Generated workspace project build failed');
    expect(await Fs.exists(Fs.join(fooDir, 'dist'))).to.eql(true);
    expect(await Fs.exists(Fs.join(fooDir, 'dist', 'index.html'))).to.eql(true);
    expect(rootDir.length > 0).to.eql(true);
  });
});
