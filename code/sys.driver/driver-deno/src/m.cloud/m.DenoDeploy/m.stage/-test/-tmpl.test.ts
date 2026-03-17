import {
  type t,
  describe,
  expect,
  expectTypeOf,
  Fs,
  it,
  slug,
  Str,
} from '../../../../-test.ts';
import { DenoDeploy } from '../../mod.ts';
import { DenoFile, TmplEngine } from '../common.ts';
import { json } from '../-tmpl/-bundle.ts';
import { PATHS, renderStageEntrypoints } from '../-tmpl/mod.ts';
import { createGeneratedRepoPkg, runDenoTask } from './u.fixture.tmpl.ts';

describe('DenoDeploy: staging (tmpl repo/pkg)', () => {
  it('keeps the staged entry template bundle in sync', async () => {
    const out = await Fs.makeTempDir({ prefix: 'driver-deno.stage-tmpl.' });
    const file = Fs.join(out.absolute, '-bundle.json');
    await TmplEngine.bundle(PATHS.files, file);

    const actual = (await Fs.readText(file)).data ?? '';
    expect(JSON.parse(actual)).to.eql(json);
  });

  it('renders the staged entry template pair from one target dir fact', () => {
    const res = renderStageEntrypoints('./code/projects/foo');
    expect(res.entry).to.include(`import { targetDir } from './entry.paths.ts';`);
    expect(res.entry).to.include(`export default await DenoEntry.serve({ targetDir });`);
    expect(res.entryPaths).to.eql(`export const targetDir = './code/projects/foo';\n`);
  });

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
    expect(await Fs.exists(Fs.join(res.root, 'code/projects/foo/dist/index.html'))).to.eql(true);
    expect(res.entry).to.eql(Fs.join(res.root, 'entry.paths.ts'));

    const stageText = (await Fs.readText(res.entry)).data ?? '';
    expect(stageText).to.eql(`export const targetDir = './code/projects/foo';\n`);

    const walkup = false;
    const stagedWorkspace = await DenoFile.workspace(Fs.join(res.root, 'deno.json'), { walkup });
    expect(stagedWorkspace.exists).to.eql(true);
    expect(stagedWorkspace.children.map((child) => child.path.dir)).to.include('code/projects/foo');

    const stagedPkg = await DenoFile.load(Fs.join(res.root, 'code/projects/foo'));
    expect(stagedPkg.data?.name).to.eql('@tmp/foo');

    const mod = await import(`file://${res.entry}?v=${slug()}`);
    expect(mod.targetDir).to.eql('./code/projects/foo');
  });
});
