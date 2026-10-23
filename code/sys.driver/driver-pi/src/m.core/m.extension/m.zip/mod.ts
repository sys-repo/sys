/**
 * @module
 * Wrapper-owned bounded ZIP tools and opt-in cooperative extraction.
 */
import type { t } from './common.ts';
import { resolvePolicy, toolNames } from './u/u.policy.ts';
import { toPromptArgs } from './u/u.prompt.ts';
import { writeExtension } from './u/u.write.ts';

/**
 * ZIP extension policy, materialization, and tool-contract helpers.
 */
export const Zip: t.PiZipExtension.Lib = Object.freeze({
  resolvePolicy,
  toolNames,
  toPromptArgs,
  write: writeExtension,
});
