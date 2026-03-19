import { type t } from './common.ts';
import { executeStage } from './u.executeStage.ts';

export const stage: t.DenoDeploy.Lib['stage'] = async (request) => {
  return await executeStage(request);
};
