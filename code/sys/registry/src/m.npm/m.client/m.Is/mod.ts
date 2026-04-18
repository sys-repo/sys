/**
 * @module
 * npm package-name predicates.
 */
import type { t } from './common.ts';
import { pkgName } from './u.pkgName.ts';

export const Is: t.NpmIsLib = {
  pkgName,
};
