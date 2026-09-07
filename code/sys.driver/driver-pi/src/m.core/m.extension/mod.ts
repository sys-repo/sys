/**
 * @module
 * Wrapper-owned Pi extensions.
 */
import type { t } from './common.ts';
import { Ocr } from './m.ocr/mod.ts';
import { SandboxFs } from './m.sandbox.fs/mod.ts';
import { Zip } from './m.zip/mod.ts';

/** Wrapper-owned Pi extension namespace. */
export const PiExtension: t.PiExtension.Lib = {
  Ocr,
  SandboxFs,
  Zip,
};
