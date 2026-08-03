import type { t } from '@sys/cell';
import { Deploy } from '@sys/tools/deploy';

export const DeployPrepTask: t.Cell.Task.Endpoint = {
  run: ({ cwd, paths }) => Deploy.stage({ cwd, paths: { config: paths.config! } }),
};

export const DeployPushTask: t.Cell.Task.Endpoint = {
  run: ({ cwd, paths }) => Deploy.push({ cwd, paths: { config: paths.config! } }),
};
