import { describe, expect, Fs, it } from '../../../../-test.ts';
import { DenoDeploy } from '../../mod.ts';
import { createDeployableRepoPkg } from '../../-test.external/u.fixture.ts';
import { prepare } from '../u.prepare.ts';

describe('DenoDeploy.pipeline.prepare', () => {
  it('prepares a staged deploy root for the generated entry pair', async () => {
    const { pkgDir } = await createDeployableRepoPkg();
    const stage = await DenoDeploy.stage({ target: { dir: pkgDir } });
    const res = await prepare(stage);

    expect(res.stagedDir).to.eql(stage.root);
    expect(res.entrypoint).to.eql(stage.entry);
    expect(res.entryPaths).to.eql(Fs.join(stage.root, 'entry.paths.ts'));
    expect(res.appEntrypoint).to.eql('./src/m.server/main.ts');
    expect(res.workspaceTarget).to.eql('./code/projects/foo');
    expect(res.distDir).to.eql('./code/projects/foo/dist');

    expect(await Fs.exists(Fs.join(stage.root, 'src', 'm.server', 'main.ts'))).to.be.true;
    expect((await Fs.readText(Fs.join(stage.root, 'src', 'm.server', 'main.ts'))).data).to.eql(
      `export { default } from '../../entry.ts';\nexport * from '../../entry.ts';\n`,
    );
    expect((await Fs.readJson<Record<string, unknown>>(Fs.join(stage.root, 'deno.json'))).data?.deploy).to.eql({
      entrypoint: './entry.ts',
      cwd: './',
    });

    const gitignore = (await Fs.readText(Fs.join(stage.root, '.gitignore'))).data ?? '';
    expect(gitignore).to.include('!code/');
    expect(gitignore).to.include('!code/projects/');
    expect(gitignore).to.include('!code/projects/foo/');
    expect(gitignore).to.include('!code/projects/foo/dist/');
    expect(gitignore).to.include('!code/projects/foo/dist/**');
  });
});
