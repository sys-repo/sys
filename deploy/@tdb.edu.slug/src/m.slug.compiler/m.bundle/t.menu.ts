import type { t } from './common.ts';

export type BundleProfileAction = 'run';

export type BundleProfilePick =
  | { kind: 'exit' }
  | { kind: 'back'; profile?: t.StringFile }
  | { kind: 'run'; profile: t.StringFile };
