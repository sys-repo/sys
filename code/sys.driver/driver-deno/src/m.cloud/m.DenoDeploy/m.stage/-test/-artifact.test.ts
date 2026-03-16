import {
  type t,
  describe,
  expect,
  expectTypeOf,
  Fs,
  it,
  slug,
} from '../../../../-test.ts';
import { DenoFile } from '../../../../m.runtime/mod.ts';
import { DenoDeploy } from '../../mod.ts';
import { createStageWorkspace } from './u.fixture.workspace.ts';

describe('DenoDeploy: staging artifact', () => {
  describe('workspace materialization', () => {
    it('stages a workspace target into a temp root', async () => {
      const fs = await createStageWorkspace();
      const res = await DenoDeploy.stage({ target: { dir: fs.join('code/apps/foo') } });

      expectTypeOf(res).toEqualTypeOf<t.DenoDeploy.Stage.Result>();
      expect(res.workspace.exists).to.eql(true);
      expect(res.workspace.dir).to.eql(fs.dir);
      expect(res.target.dir).to.eql(fs.join('code/apps/foo'));

      expect(await Fs.exists(Fs.join(res.root, 'deno.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(res.root, 'code/apps/foo/src/mod.ts'))).to.eql(true);
      expect(await Fs.exists(Fs.join(res.root, 'libs/bar/src/mod.ts'))).to.eql(true);
      expect(res.entry).to.eql(Fs.join(res.root, 'entry.paths.ts'));
    });

    it('stages into a caller-provided empty root', async () => {
      const fs = await createStageWorkspace();
      const parent = await Fs.makeTempDir({ prefix: 'DenoDeploy.stage.root-' });
      const stageRoot = Fs.join(parent.absolute, 'stage');
      const res = await DenoDeploy.stage({
        target: { dir: fs.join('code/apps/foo') },
        root: { kind: 'path', dir: stageRoot },
      });

      expect(res.root).to.eql(stageRoot);
      expect(await Fs.exists(Fs.join(stageRoot, 'code/apps/foo/src/mod.ts'))).to.eql(true);
      expect((await Fs.readText(res.entry)).data).to.eql(
        `export const targetEntry = './code/apps/foo/src/mod.ts';\nexport const targetDir = './code/apps/foo';\nexport const targetPkg = './code/apps/foo/src/pkg.ts';\nexport const targetDist = './code/apps/foo/dist/';\n`,
      );
    });
  });

  describe('staged root behavior', () => {
    it('reloads as a workspace and preserves target path metadata', async () => {
      const fs = await createStageWorkspace();
      const res = await DenoDeploy.stage({ target: { dir: fs.join('code/apps/foo') } });

      const stagedWorkspace = await DenoFile.workspace(Fs.join(res.root, 'deno.json'), {
        walkup: false,
      });
      expect(stagedWorkspace.exists).to.eql(true);
      expect(stagedWorkspace.children.map((child) => child.path.dir).toSorted()).to.eql([
        'code/apps/foo',
        'libs/bar',
      ]);

      const mod = await import(`file://${res.entry}?v=${slug()}`);
      expect(mod.targetEntry).to.eql('./code/apps/foo/src/mod.ts');
      expect(mod.targetDir).to.eql('./code/apps/foo');
      expect(mod.targetPkg).to.eql('./code/apps/foo/src/pkg.ts');
      expect(mod.targetDist).to.eql('./code/apps/foo/dist/');
    });
  });
});
