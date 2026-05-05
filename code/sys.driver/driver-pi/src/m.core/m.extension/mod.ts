/**
 * @module
 * Wrapper-owned Pi extensions.
 */
import type { t } from './common.ts';
import { SandboxFs } from './m.sandbox.fs/mod.ts';

/** Wrapper-owned Pi extension namespace. */
export const PiExtension: t.PiExtension.Lib = {
  SandboxFs,
};
