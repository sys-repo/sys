import { describe, expect, Fs, it, Path } from '../../../../-test.ts';
import { withTmpDir } from '../../../-test/-fixtures.ts';
import { DenoProvider } from '../mod.ts';
import { createDenoWorkspace } from '../../../u.menu/-test/u.fixture.ts';

describe('DenoProvider.Sidecar', () => {
  it('writes and reads the staged deno artifact metadata', async () => {
    await withTmpDir(async (tmp) => {
      const doc = {
        target: { dir: `${tmp}/code/apps/foo` },
        workspace: { dir: tmp },
        root: `${tmp}-stage`,
        entry: `${tmp}-stage/entry.ts`,
      } as const;

      await DenoProvider.Sidecar.write(doc.root, doc);
      const read = await DenoProvider.Sidecar.read(doc.root);

      expect(read).to.eql(doc);
    });
  });

  it('stage writes a validated sidecar beside the staged artifact', async () => {
    await withTmpDir(async (tmp) => {
      await createDenoWorkspace(tmp);

      await withTmpDir(async (stageParent) => {
        const stageRoot = Path.join(stageParent, 'stage');
        const res = await DenoProvider.stage({
          cwd: tmp,
          yaml: {
            provider: { kind: 'deno', app: 'my-app' },
            source: { dir: '.' },
            staging: { dir: stageRoot, clear: true },
            mappings: [{ mode: 'index', dir: { source: './code/apps/foo', staging: '.' } }],
          },
        });

        expect(res.ok).to.eql(true);

        const sidecar = await DenoProvider.Sidecar.read(stageRoot);
        expect(sidecar.root).to.eql(stageRoot);
        expect(sidecar.workspace.dir).to.eql(tmp);
        expect(sidecar.target.dir).to.eql(`${tmp}/code/apps/foo`);
        expect(sidecar.entry).to.eql(`${stageRoot}/entry.ts`);
        expect(await Fs.exists(DenoProvider.Sidecar.path(stageRoot))).to.eql(true);
      }, { prefix: 'sys.tools.deploy.deno-stage.' });
    });
  });
});
