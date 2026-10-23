import { describe, expect, Fs, it, type t } from '../../-test.ts';
import { assertRunOk } from './u.fixture.run.ts';
import { buildGeneratedRepo } from './u.fixture.tmpl.ts';

describe('Vite external smoke (repo-generated)', () => {
  it('build: generated tmpl.repo project foo succeeds in external workspace', async () => {
    const { rootDir, fooDir, generate, bootstrap, build } = await buildGeneratedRepo({
      sampleName: 'Vite.repo.generated',
    });

    assertRunOk(generate, 'Generated repo project creation failed');
    expect(await Fs.exists(Fs.join(fooDir, 'deno.json'))).to.eql(true);

    const denoJson = (await Fs.readJson<t.DenoFile.Json>(Fs.join(fooDir, 'deno.json'))).data;
    expect(denoJson?.name).to.eql('@tmp/foo');

    assertRunOk(bootstrap, 'Generated repo bootstrap failed');
    expect(await Fs.exists(Fs.join(rootDir, 'deno.lock'))).to.eql(true);

    assertRunOk(build, 'Generated repo project build failed');
    expect(await Fs.exists(Fs.join(fooDir, 'dist'))).to.eql(true);
    expect(await Fs.exists(Fs.join(fooDir, 'dist', 'index.html'))).to.eql(true);
    expect(rootDir.length > 0).to.eql(true);
  });
});
