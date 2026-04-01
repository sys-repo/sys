import {
  type t,
  describe,
  expect,
  expectTypeOf,
  Fs,
  it,
  slug,
  Testing,
  Workspace,
} from '../../../../-test.ts';
import { DenoFile } from '../../../../m.runtime/mod.ts';
import { DenoDeploy } from '../../mod.ts';
import {
  addStageRuntimeDriverFixture,
  addRetainedPackageJunkFixture,
  createStageWorkspace,
  getStageError,
  writeWorkspaceGraphSnapshot,
} from './u.fixture.workspace.ts';
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
    it('skips build cleanly when the target package has no build task', async () => {
      const fs = await Testing.dir('DenoDeploy.stage.no-build-task');
      await Fs.writeJson(fs.join('deno.json'), {
        name: 'root',
        version: '0.0.0',
        workspace: ['./code/apps/foo'],
      });
      await Fs.writeJson(fs.join('code/apps/foo/deno.json'), {
        name: '@test/foo',
        version: '0.0.0',
        exports: { '.': './src/mod.ts' },
      });
      await Fs.write(fs.join('code/apps/foo/src/mod.ts'), `export const foo = true;\n`);
      await writeWorkspaceGraphSnapshot(fs.dir, {
        orderedPaths: ['code/apps/foo'],
        edges: [],
      });

      const res = await DenoDeploy.stage({ target: { dir: fs.join('code/apps/foo') } });
      expect(await Fs.exists(Fs.join(res.root, 'code/apps/foo/src/mod.ts'))).to.be.true;
      expect(await Fs.exists(Fs.join(res.root, 'code/apps/foo/dist'))).to.be.false;
    });

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

    it('retains stage runtime packages locally and rewrites imports to local staged paths', async () => {
      const fs = await createStageWorkspace();
      await addStageRuntimeDriverFixture(fs.dir);
      await writeWorkspaceGraphSnapshot(fs.dir, {
        orderedPaths: [
          'code/sys/types',
          'code/sys/fs',
          'code/sys.driver/driver-deno',
          'libs/bar',
          'code/apps/foo',
          'libs/baz',
        ],
        edges: [
          { from: 'code/sys/types', to: 'code/sys/fs' },
          { from: 'code/sys/fs', to: 'code/sys.driver/driver-deno' },
          { from: 'code/sys.driver/driver-deno', to: 'code/apps/foo' },
          { from: 'libs/bar', to: 'code/apps/foo' },
        ],
      });

      const res = await DenoDeploy.stage({ target: { dir: fs.join('code/apps/foo') } });
      expect(await Fs.exists(Fs.join(res.root, 'code/sys.driver/driver-deno/src/m.cloud/mod.ts'))).to.be.true;
      expect(await Fs.exists(Fs.join(res.root, 'code/sys/fs/src/mod.ts'))).to.be.true;
      expect(await Fs.exists(Fs.join(res.root, 'code/sys/types/src/mod.ts'))).to.be.true;

      const importMap = await Fs.readJson<{ readonly imports?: Record<string, string> }>(
        Fs.join(res.root, 'imports.json'),
      );
      expect(importMap.data?.imports?.['@sys/driver-deno']).to.eql('./code/sys.driver/driver-deno/src/mod.ts');
      expect(importMap.data?.imports?.['@sys/driver-deno/cloud']).to.eql(
        './code/sys.driver/driver-deno/src/m.cloud/mod.ts',
      );
      expect(importMap.data?.imports?.['@sys/fs']).to.eql('./code/sys/fs/src/mod.ts');
      expect(importMap.data?.imports?.['@sys/types']).to.eql('./code/sys/types/src/mod.ts');
    });

    it('filters locked junk from retained package copies', async () => {
      const fs = await createStageWorkspace();
      await addRetainedPackageJunkFixture(fs.dir);

      const res = await DenoDeploy.stage({ target: { dir: fs.join('code/apps/foo') } });

      expect(await Fs.exists(Fs.join(res.root, 'libs/bar/src/mod.ts'))).to.be.true;
      expect(await Fs.exists(Fs.join(res.root, 'libs/bar/.DS_Store'))).to.be.false;
      expect(await Fs.exists(Fs.join(res.root, 'libs/bar/.env'))).to.be.false;
      expect(await Fs.exists(Fs.join(res.root, 'libs/bar/.tmp/cache.txt'))).to.be.false;
      expect(await Fs.exists(Fs.join(res.root, 'libs/bar/node_modules/pkg/index.js'))).to.be.false;
      expect(await Fs.exists(Fs.join(res.root, 'libs/bar/src/-test/fixture.test.ts'))).to.be.false;
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
      await Fs.remove(Fs.join(fs.dir, 'deno.graph.json'));

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
