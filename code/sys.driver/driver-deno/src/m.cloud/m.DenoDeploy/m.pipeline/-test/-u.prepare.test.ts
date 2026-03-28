import { type t, describe, Esm, expect, Fs, it } from '../../../../-test.ts';
import { prepare } from '../u.prepare.ts';

describe('DenoDeploy.pipeline.prepare', () => {
  it('prepares a staged deploy root for the generated entry pair', async () => {
    const stage = await createStageFixture();
    const res = await prepare(stage);

    expect(res.sourceDir).to.eql(stage.target.dir);
    expect(res.stagedDir).to.eql(stage.root);
    expect(res.entrypoint).to.eql(stage.entry);
    expect(res.entryPaths).to.eql(Fs.join(stage.root, 'entry.paths.ts'));
    expect(res.appEntrypoint).to.eql('./src/m.server/main.ts');
    expect(res.workspaceTarget).to.eql('./code/projects/foo');
    expect(res.distDir).to.eql('./code/projects/foo/dist');
    expect(res.distHash).to.eql('sha256-abc123');

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

async function createStageFixture(): Promise<t.DenoDeploy.Stage.Result> {
  const workspaceDir = (await Fs.makeTempDir({ prefix: 'driver-deno.pipeline.workspace.' }))
    .absolute as t.StringDir;
  const root = (await Fs.makeTempDir({ prefix: 'driver-deno.pipeline.stage.' })).absolute as t.StringDir;
  const targetDir = Fs.join(workspaceDir, 'code', 'projects', 'foo') as t.StringDir;
  const entry = Fs.join(root, 'entry.ts') as t.StringPath;

  await Fs.ensureDir(targetDir);
  await Fs.ensureDir(Fs.join(root, 'src', 'm.server'));
  await Fs.ensureDir(Fs.join(root, 'code/projects/foo/dist'));
  await Fs.writeJson(Fs.join(root, 'deno.json'), {});
  await Fs.write(Fs.join(root, '.gitignore'), 'dist/\n');
  await Fs.write(entry, '// staged entry\n');
  await Fs.writeJson(Fs.join(root, 'code/projects/foo/dist/dist.json'), {
    hash: { digest: 'sha256-abc123' },
  });

  const workspace: t.DenoWorkspace = {
    exists: true,
    dir: workspaceDir,
    file: Fs.join(workspaceDir, 'deno.json') as t.StringPath,
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
