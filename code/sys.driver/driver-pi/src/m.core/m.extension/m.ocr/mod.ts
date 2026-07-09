/**
 * @module
 * Wrapper-owned optical character recognition (OCR) Pi extension.
 */
import type { t } from './common.ts';
import { resolvePolicy } from './u.policy.ts';
import { toPromptArgs } from './u.prompt.ts';

/** Optical character recognition (OCR) extension namespace. */
export const Ocr: t.PiOcrExtension.Lib = {
  resolvePolicy,
  toPromptArgs,
};
