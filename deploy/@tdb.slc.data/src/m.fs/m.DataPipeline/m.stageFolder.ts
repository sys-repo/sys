import type { t } from './common.ts';

export const stageFolder: t.SlcDataPipeline.StageFolder.Run = async (args) => {
  return {
    ok: true,
    kind: 'stage-folder',
    source: args.source,
    target: args.target,
  };
};
