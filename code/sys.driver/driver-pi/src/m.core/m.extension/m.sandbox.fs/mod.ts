/**
 * @module
 * Wrapper-owned sandbox filesystem Pi extension.
 */
import type { t } from './common.ts';
import { resolvePolicy, toolNames } from './u/u.policy.ts';
import { toPromptArgs } from './u/u.prompt.ts';
import { writeExtension } from './u/u.write.ts';

/** Sandbox filesystem extension namespace. */
export const SandboxFs: t.PiSandboxFsExtension.Lib = {
  resolvePolicy,
  toolNames,
  toPromptArgs,
  write: writeExtension,
};
