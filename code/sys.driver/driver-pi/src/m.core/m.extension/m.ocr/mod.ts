/**
 * @module
 * Wrapper-owned optical character recognition (OCR) Pi extension.
 */
import type { t } from './common.ts';
import { dependencies, installCommand } from './u.deps.ts';
import { policy } from './u.policy.ts';
import { toPromptArgs } from './u.prompt.ts';

/** Optical character recognition (OCR) extension namespace. */
export const Ocr: t.PiOcrExtension.Lib = {
  Resolve: { policy, dependencies },
  installCommand,
  toPromptArgs,
};
