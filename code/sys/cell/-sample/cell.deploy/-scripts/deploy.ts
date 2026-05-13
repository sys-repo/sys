import type { t } from '@sys/cell';
import { Deploy } from '@sys/tools/deploy';
import { Pull } from '@sys/tools/pull';

export const PullViewTask: t.Cell.Task.Endpoint = {
  run: ({ cwd, paths }) => Pull.run({ cwd, config: paths.config! }),
};

export const DeployPrepTask: t.Cell.Task.Endpoint = {
  run: ({ cwd, paths }) => Deploy.stage({ cwd, config: paths.config! }),
};

export const DeployPushTask: t.Cell.Task.Endpoint = {
  run: ({ cwd, paths }) => Deploy.push({ cwd, config: paths.config! }),
};
