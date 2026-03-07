import type { t } from './common.ts';

/**
 * Library: root driver API:
 */
export type MastraLib = Readonly<{
  Memory: t.MastraMemoryLib;
}>;
