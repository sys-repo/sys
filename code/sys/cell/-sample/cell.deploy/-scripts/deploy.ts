import type { t } from '@sys/cell';
import { Deploy } from '@sys/tools/deploy';
import { Pull } from '@sys/tools/pull';

export const PullViewAction: t.Cell.Action.Endpoint = {
  run: ({ cwd, paths }) => Pull.run({ cwd, config: paths.config! }),
};

export const DeployStageAction: t.Cell.Action.Endpoint = {
  run: ({ cwd, paths }) => Deploy.stage({ cwd, config: paths.config! }),
};
