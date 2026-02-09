import type { t } from '../common.ts';
export * from '../common.ts';

export const DEFAULT = {
  LOADING: {} satisfies t.TreeEffectController.Loading,
} as const;
