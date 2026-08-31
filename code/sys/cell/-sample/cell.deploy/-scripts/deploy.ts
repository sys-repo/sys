import type { t } from '@sys/cell';
import { Deploy } from '@sys/tools/deploy';

export const DeployStageTask: t.Cell.Task.Endpoint = {
  run: ({ cwd, paths }) => Deploy.stage({ cwd, paths: { config: paths.config! } }),
};
