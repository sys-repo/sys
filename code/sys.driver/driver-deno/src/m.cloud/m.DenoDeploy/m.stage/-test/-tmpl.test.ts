import {
  type t,
  describe,
  expect,
  expectTypeOf,
  Fs,
  it,
  slug,
} from '../../../../-test.ts';
import { DenoDeploy } from '../../mod.ts';
import { DenoFile } from '../common.ts';
import { createGeneratedRepoPkg, runDenoTask } from './u.fixture.tmpl.ts';

describe('DenoDeploy: staging (tmpl repo/pkg)', () => {
  it('stages a generated tmpl repo/package workspace target into a temp root', async () => {
    const { root, pkgDir } = await createGeneratedRepoPkg();

    const ci = await runDenoTask(root, 'ci');
    if (!ci.ok) {
      throw new Error(
        `Generated tmpl repo ci failed (code ${ci.code}).\n\nstdout:\n${ci.stdout}\n\nstderr:\n${ci.stderr}`,
      );
    }

    const res = await DenoDeploy.stage({ target: { dir: pkgDir } });

    expectTypeOf(res).toEqualTypeOf<t.DenoDeploy.Stage.Result>();
    expect(res.workspace.exists).to.eql(true);
    expect(res.workspace.dir).to.eql(root);
    expect(res.target.dir).to.eql(pkgDir);

    expect(await Fs.exists(Fs.join(res.root, 'deno.json'))).to.eql(true);
    expect(await Fs.exists(Fs.join(res.root, 'code/projects/foo/deno.json'))).to.eql(true);
    expect(await Fs.exists(Fs.join(res.root, 'code/projects/foo/src/mod.ts'))).to.eql(true);
    expect(res.entry).to.eql(Fs.join(res.root, 'deploy.entry.ts'));

    const stageText = (await Fs.readText(res.entry)).data ?? '';
    expect(stageText).to.eql(
      `import * as target from './code/projects/foo/src/mod.ts';\nexport const targetEntry = './code/projects/foo/src/mod.ts';\nexport const targetDir = './code/projects/foo';\nexport * from './code/projects/foo/src/mod.ts';\n`,
    );

    const walkup = false;
    const stagedWorkspace = await DenoFile.workspace(Fs.join(res.root, 'deno.json'), { walkup });
    expect(stagedWorkspace.exists).to.eql(true);
    expect(stagedWorkspace.children.map((child) => child.path.dir)).to.include('code/projects/foo');

    const stagedPkg = await DenoFile.load(Fs.join(res.root, 'code/projects/foo'));
    expect(stagedPkg.data?.name).to.eql('@tmp/foo');

    const mod = await import(`file://${res.entry}?v=${slug()}`);
    expect('default' in mod).to.eql(false);
    expect(mod.targetEntry).to.eql('./code/projects/foo/src/mod.ts');
    expect(mod.targetDir).to.eql('./code/projects/foo');
  });
});
