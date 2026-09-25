/**
 * @module
 * Wrapper-owned sandbox Pi extension namespace.
 */
import type { t } from './common.ts';
import { Fs } from './m.Fs.ts';

/**
 * Sandbox extension namespace.
 */
export const Sandbox: t.PiSandboxExtension.Lib = {
  Fs,
};
