import type { t } from './common.ts';

export type * from '../../../../common/t.ts';
export type * from './-SPEC.Debug.tsx';

export type TEnv = {
  is: { local: boolean };
  readonly origin: t.SlugUrlOrigin;
};
