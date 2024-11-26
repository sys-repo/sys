import type { t } from './common.ts';

export type CmdHostStatefulProps = t.CmdHostProps & {
  mutateUrl?: boolean;
};
