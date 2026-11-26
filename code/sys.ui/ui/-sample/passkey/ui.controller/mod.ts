/**
 * @module
 * Host-owned passkey panel lifetime and its React adapter.
 */
import type { t } from '../ui/common.ts';
import { open } from './u.open.ts';
import { UI } from './ui.tsx';

export const Controller: t.Controller.Lib = Object.freeze({ open, UI });
