import {
  type t,
  describe,
  expect,
  expectTypeOf,
  Fs,
  it,
  slug,
  Workspace,
} from '../../../../-test.ts';
import { DenoFile } from '../../../../m.runtime/mod.ts';
import { DenoDeploy } from '../../mod.ts';
import { createStageWorkspace, getStageError } from './u.fixture.workspace.ts';
import { closureFromGraph } from '../u.closureFromGraph.ts';

describe('DenoDeploy: staging artifact', () => {
  describe('package closure', () => {
    it('normalizes ./prefixed target against bare graph edges', () => {
      const retain = closureFromGraph(
        {
          orderedPaths: ['libs/bar', 'code/apps/foo'],
          edges: [{ from: 'libs/bar', to: 'code/apps/foo' }],
        },
        './code/apps/foo',
      );

      expect([...retain].toSorted()).to.eql(['code/apps/foo', 'libs/bar']);
    });
  });

  describe('workspace materialization', () => {
    it('stages a workspace target into a temp root', async () => {
      const fs = await createStageWorkspace();
      const snapshot = await Workspace.Prep.Graph.read(fs.dir);
      expect(snapshot).to.not.eql(undefined);
      expect(snapshot?.graph.edges.length).to.eql(1);
      const res = await DenoDeploy.stage({ target: { dir: fs.join('code/apps/foo') } });

      expectTypeOf(res).toEqualTypeOf<t.DenoDeploy.Stage.Result>();
      expect(res.workspace.exists).to.be.true;
      expect(res.workspace.dir).to.eql(fs.dir);
      expect(res.target.dir).to.eql(fs.join('code/apps/foo'));

      expect(await Fs.exists(Fs.join(res.root, 'deno.json'))).to.be.true;
      expect(await Fs.exists(Fs.join(res.root, 'deno.lock'))).to.be.true;
      expect(await Fs.exists(Fs.join(res.root, 'imports.json'))).to.be.true;
      expect(await Fs.exists(Fs.join(res.root, 'code/apps/foo/src/mod.ts'))).to.be.true;
      expect(await Fs.exists(Fs.join(res.root, 'libs/bar/src/mod.ts'))).to.be.true;
      expect(await Fs.exists(Fs.join(res.root, 'libs/baz/src/mod.ts'))).to.be.false;
      expect(await Fs.exists(Fs.join(res.root, 'code/apps/foo/dist/index.html'))).to.be.true;
      expect(await Fs.exists(Fs.join(res.root, 'entry.paths.ts'))).to.be.true;
      expect(res.entry).to.eql(Fs.join(res.root, 'entry.ts'));
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
      expect(await Fs.exists(Fs.join(stageRoot, 'code/apps/foo/src/mod.ts'))).to.be.true;
      expect(await Fs.exists(Fs.join(stageRoot, 'code/apps/foo/dist/index.html'))).to.be.true;
      expect((await Fs.readText(res.entry)).data ?? '').to.include(
        `import { targetDir } from './entry.paths.ts';`,
      );
      expect((await Fs.readText(Fs.join(stageRoot, 'entry.paths.ts'))).data).to.eql(
        `export const targetDir = './code/apps/foo';\n`,
      );
    });

    it('fails clearly when the workspace graph snapshot is missing', async () => {
      const fs = await createStageWorkspace();
      await Fs.remove(Fs.join(fs.dir, '.tmp', 'workspace.graph.json'));

      const err = await getStageError(() => DenoDeploy.stage({ target: { dir: fs.join('code/apps/foo') } }));
      expect(err?.message).to.include('missing workspace graph snapshot');
      expect(err?.message).to.include('run prep first');
    });
  });

  describe('staged root behavior', () => {
    it('reloads as a workspace and preserves target path metadata', async () => {
      const fs = await createStageWorkspace();
      const res = await DenoDeploy.stage({ target: { dir: fs.join('code/apps/foo') } });

      const stagedWorkspace = await DenoFile.workspace(Fs.join(res.root, 'deno.json'), {
        walkup: false,
      });
      expect(stagedWorkspace.exists).to.be.true;
      expect((await Fs.readJson<{ workspace?: string[] }>(Fs.join(res.root, 'deno.json'))).data?.workspace).to.eql([
        './code/apps/foo',
        './libs/bar',
      ]);
      expect(stagedWorkspace.children.map((child) => child.path.dir).toSorted()).to.eql(['code/apps/foo', 'libs/bar']);

      const mod = await import(`file://${Fs.join(res.root, 'entry.paths.ts')}?v=${slug()}`);
      expect(mod.targetDir).to.eql('./code/apps/foo');
    });
  });
});
