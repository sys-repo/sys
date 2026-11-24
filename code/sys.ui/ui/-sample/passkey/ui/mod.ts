/**
 * @module
 * Presentation for the passkey sample. The panel renders supplied observations and emits action
 * intent; it does not open ceremonies or send account requests.
 */
import type { t } from './common.ts';
import { Passkey as UI } from './ui.tsx';
import { Actions } from './ui.Actions.tsx';
import { Context } from './ui.Context.tsx';
import { Status } from './ui.Status.tsx';

/**
 * Render the diagnostic panel or its Actions, Status, and Context sections independently.
 */
export const Passkey: t.Passkey.Lib = Object.freeze({
  UI: Object.assign(UI, { Actions, Status, Context }),
});
