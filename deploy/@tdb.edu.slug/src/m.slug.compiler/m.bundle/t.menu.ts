import type { t } from './common.ts';

/** Supported bundle profile actions. */
export type BundleProfileAction = 'run';

/** Menu selection result for bundle profile picks. */
export type BundleProfilePick =
  | { kind: 'exit' }
  | { kind: 'back'; profile?: t.StringFile }
  | { kind: 'run'; profile: t.StringFile };
