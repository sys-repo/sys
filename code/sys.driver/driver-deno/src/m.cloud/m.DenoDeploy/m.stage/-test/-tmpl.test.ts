import {
  type t,
  describe,
  expect,
  expectTypeOf,
  Fs,
  it,
  pkg,
  slug,
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
    expect(res.entry).to.include(`import { Fs } from '@sys/fs';`);
    expect(res.entry).to.include(`import { targetDir } from './entry.paths.ts';`);
    expect(res.entry).to.include(`const cwd = Fs.Path.fromFileUrl(new URL('.', import.meta.url));`);
    expect(res.entry).to.include(`export default await DenoEntry.serve({ cwd, targetDir });`);
    expect(res.entryPaths).to.eql(`export const targetDir = './code/projects/foo';\n`);
    expect(res.compatEntrypoint).to.eql(
      `export { default } from '../../entry.ts';\nexport * from '../../entry.ts';\n`,
    );
  });

  it('stages a generated tmpl repo/package workspace target into a temp root (slow)', async () => {
    const { root, pkgDir } = await createGeneratedRepoPkg();

    const ci = await runDenoTask(root, 'ci');
    if (!ci.ok) {
      throw new Error(
        `Generated tmpl repo ci failed (code ${ci.code}).\n\nstdout:\n${ci.stdout}\n\nstderr:\n${ci.stderr}`,
      );
    }

    const res = await DenoDeploy.stage({ target: { dir: pkgDir } });

    expectTypeOf(res).toEqualTypeOf<t.DenoDeploy.Stage.Result>();
    expect(res.workspace.exists).to.be.true;
    expect(res.workspace.dir).to.eql(root);
    expect(res.target.dir).to.eql(pkgDir);

    expect(await Fs.exists(Fs.join(res.root, 'deno.json'))).to.be.true;
    expect(await Fs.exists(Fs.join(res.root, 'code/projects/foo/deno.json'))).to.be.true;
    expect(await Fs.exists(Fs.join(res.root, 'code/projects/foo/src/mod.ts'))).to.be.true;
    expect(await Fs.exists(Fs.join(res.root, 'code/projects/foo/dist/index.html'))).to.be.true;
    expect(await Fs.exists(Fs.join(res.root, 'entry.paths.ts'))).to.be.true;
    expect(res.entry).to.eql(Fs.join(res.root, 'entry.ts'));

    const entryText = (await Fs.readText(res.entry)).data ?? '';
    expect(entryText).to.include(`import { Fs } from '@sys/fs';`);
    expect(entryText).to.include(`import { targetDir } from './entry.paths.ts';`);
    expect(entryText).to.include(`const cwd = Fs.Path.fromFileUrl(new URL('.', import.meta.url));`);
    expect(entryText).to.include(`export default await DenoEntry.serve({ cwd, targetDir });`);
    const stageText = (await Fs.readText(Fs.join(res.root, 'entry.paths.ts'))).data ?? '';
    expect(stageText).to.eql(`export const targetDir = './code/projects/foo';\n`);
    const importMap = await Fs.readJson<{ readonly imports?: Record<string, string> }>(Fs.join(res.root, 'imports.json'));
    expect(importMap.data?.imports?.['@sys/driver-deno']).to.eql(`jsr:@sys/driver-deno@${pkg.version}`);
    expect(importMap.data?.imports?.['@sys/driver-deno/cloud']).to.eql(`jsr:@sys/driver-deno@${pkg.version}/cloud`);

    const walkup = false;
    const stagedWorkspace = await DenoFile.workspace(Fs.join(res.root, 'deno.json'), { walkup });
    expect(stagedWorkspace.exists).to.be.true;
    expect(stagedWorkspace.children.map((child) => child.path.dir)).to.include('code/projects/foo');

    const stagedPkg = await DenoFile.load(Fs.join(res.root, 'code/projects/foo'));
    expect(stagedPkg.data?.name).to.eql('@tmp/foo');

    const mod = await import(`file://${Fs.join(res.root, 'entry.paths.ts')}?v=${slug()}`);
    expect(mod.targetDir).to.eql('./code/projects/foo');
  });
});
