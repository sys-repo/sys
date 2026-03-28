import { describe, expect, Fs, it } from '../../../../-test.ts';
import { DenoDeploy } from '../../mod.ts';
import { createStageWorkspace, getStageError } from './u.fixture.workspace.ts';

describe('DenoDeploy: staging root policy', () => {
  describe('caller-provided roots', () => {
    it('rejects a non-empty caller-provided stage root', async () => {
      const fs = await createStageWorkspace();
      const parent = await Fs.makeTempDir({ prefix: 'DenoDeploy.stage.root-' });
      const stageRoot = Fs.join(parent.absolute, 'stage');
      await Fs.write(Fs.join(stageRoot, 'keep.txt'), 'x');
      const error = await getStageError(() =>
        DenoDeploy.stage({
          target: { dir: fs.join('code/apps/foo') },
          root: { kind: 'path', dir: stageRoot },
        }),
      );

      expect(error?.message).to.eql(`DenoDeploy.stage: stage root '${stageRoot}' must be empty`);
    });

    it('rejects a caller-provided stage root inside the workspace', async () => {
      const fs = await createStageWorkspace();
      const stageRoot = fs.join('out/stage');
      const error = await getStageError(() =>
        DenoDeploy.stage({
          target: { dir: fs.join('code/apps/foo') },
          root: { kind: 'path', dir: stageRoot },
        }),
      );

      expect(error?.message).to.eql(
        `DenoDeploy.stage: stage root '${stageRoot}' must be outside workspace '${fs.dir}'`,
      );
    });
  });
});
