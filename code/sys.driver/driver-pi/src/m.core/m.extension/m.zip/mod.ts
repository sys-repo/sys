/**
 * @module
 * Wrapper-owned bounded ZIP inspection Pi extension.
 */
import type { t } from './common.ts';
import { resolvePolicy, toolNames } from './u/u.policy.ts';
import { toPromptArgs } from './u/u.prompt.ts';
import { writeExtension } from './u/u.write.ts';

/**
 * Read-only ZIP extension helpers.
 */
export const Zip: t.PiZipExtension.Lib = Object.freeze({
  resolvePolicy,
  toolNames,
  toPromptArgs,
  write: writeExtension,
});
