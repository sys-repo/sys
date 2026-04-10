import { type t, describe, Esm, expect, Fs, it } from '../../../../-test.ts';
import { DenoDeploy } from '../../mod.ts';

describe('DenoDeploy.prepare', () => {
  it('prepares a staged deploy root for the generated entry pair', async () => {
    const stage = await createStageFixture();
    const res = await DenoDeploy.prepare(stage);

    expect(res.sourceDir).to.eql(stage.target.dir);
    expect(res.stagedDir).to.eql(stage.root);
    expect(res.entrypoint).to.eql(stage.entry);
    expect(res.entryPaths).to.eql(Fs.join(stage.root, 'entry.paths.ts'));
    expect(res.appEntrypoint).to.eql('./-staged/m.server.ts');
    expect(res.workspaceTarget).to.eql('./code/projects/foo');
    expect(res.distDir).to.eql('./code/projects/foo/dist');
    expect(res.distHash).to.eql('sha256-abc123');

    expect(await Fs.exists(Fs.join(stage.root, '-staged', 'm.server.ts'))).to.be.true;
    expect((await Fs.readText(Fs.join(stage.root, '-staged', 'm.server.ts'))).data).to.eql(
      `export { default } from '../entry.ts';\nexport * from '../entry.ts';\n`,
    );
    const deno = (await Fs.readJson<t.JsonMap>(Fs.join(stage.root, 'deno.json'))).data;
    expect(deno?.deploy).to.eql({
      entrypoint: './entry.ts',
      cwd: './',
    });
    expect(deno?.workspace).to.eql(undefined);

    const gitignore = (await Fs.readText(Fs.join(stage.root, '.gitignore'))).data ?? '';
    expect(gitignore).to.include('!code/');
    expect(gitignore).to.include('!code/projects/');
    expect(gitignore).to.include('!code/projects/foo/');
    expect(gitignore).to.include('!code/projects/foo/dist/');
    expect(gitignore).to.include('!code/projects/foo/dist/**');
  });
});

/**
 * Helpers:
 */
const makeTempDir = async (prefix: string) => (await Fs.makeTempDir({ prefix })).absolute;

async function createStageFixture(): Promise<t.DenoDeploy.Stage.Result> {
  const workspaceDir = await makeTempDir('driver-deno.pipeline.workspace.');
  const root = await makeTempDir('driver-deno.pipeline.stage.');
  const targetDir = Fs.join(workspaceDir, 'code', 'projects', 'foo');
  const entry = Fs.join(root, 'entry.ts');

  await Fs.ensureDir(targetDir);
  await Fs.ensureDir(Fs.join(root, '-staged'));
  await Fs.ensureDir(Fs.join(root, 'code/projects/foo/dist'));
  await Fs.writeJson(Fs.join(root, 'deno.json'), {
    workspace: ['./code/projects/foo', './code/projects/bar'],
  });
  await Fs.write(Fs.join(root, '.gitignore'), 'dist/\n');
  await Fs.write(entry, '// staged entry\n');
  await Fs.writeJson(Fs.join(root, 'code/projects/foo/dist/dist.json'), {
    hash: { digest: 'sha256-abc123' },
  });

  const workspace: t.DenoWorkspace = {
    exists: true,
    dir: workspaceDir,
    file: Fs.join(workspaceDir, 'deno.json'),
    children: [],
    modules: Esm.Modules.create(),
  };

  return {
    target: { dir: targetDir },
    workspace,
    root,
    entry,
  };
}
