/**
 * @module
 * Wrapper-owned optical character recognition (OCR) Pi extension.
 */
import type { t } from './common.ts';
import { dependencies, installCommand } from './u/u.deps.ts';
import { resolveExtensionPolicy } from './u/u.extension.policy.ts';
import { policy } from './u/u.policy.ts';
import { toPromptArgs } from './u/u.prompt.ts';
import { write } from './u/u.write.ts';

/** Optical character recognition (OCR) extension namespace. */
export const Ocr: t.PiOcrExtension.Lib = {
  Resolve: { policy, dependencies },
  installCommand,
  resolveExtensionPolicy,
  write,
  toPromptArgs,
};
