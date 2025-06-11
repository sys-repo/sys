import type { t } from './common.ts';

export type * from './t.Ref.ts';
export type * from './t.Repo.ts';

type O = Record<string, unknown>;

/**
 * Boolean flag evaluators:
 */
export type CrdtIsLib = {
  ref<T extends O>(input?: unknown): input is t.CrdtRef<T>;
};
