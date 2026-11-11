/**
 * @module
 * Internal passkey spike UI; no authentication behavior yet.
 */
import type { t } from './common.ts';
import { Passkey as UI } from './ui.tsx';
import { Actions } from './ui.Actions.tsx';
import { Context } from './ui.Context.tsx';
import { Status } from './ui.Status.tsx';

/**
 * Passkey spike rendering surface.
 */
export const Passkey: t.Passkey.Lib = Object.freeze({
  UI: Object.assign(UI, { Actions, Status, Context }),
});
