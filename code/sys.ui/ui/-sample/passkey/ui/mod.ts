/**
 * @module
 * Internal passkey spike UI; no authentication behavior yet.
 */
import type { t } from './common.ts';
import { Passkey as UI } from './ui.tsx';

/**
 * Passkey spike rendering surface.
 */
export const Passkey: t.Passkey.Lib = Object.freeze({ UI });
