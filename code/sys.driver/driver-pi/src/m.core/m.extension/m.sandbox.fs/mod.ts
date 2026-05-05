/**
 * @module
 * Wrapper-owned sandbox filesystem Pi extension.
 */
import type { t } from './common.ts';
import { resolvePolicy } from './u.policy.ts';
import { toPromptArgs } from './u.prompt.ts';
import { writeExtension } from './u.write.ts';

/** Sandbox filesystem extension namespace. */
export const SandboxFs: t.PiSandboxFsExtension.Lib = {
  resolvePolicy,
  toPromptArgs,
  write: writeExtension,
};
