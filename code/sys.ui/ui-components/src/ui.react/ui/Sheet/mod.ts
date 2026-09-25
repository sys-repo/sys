/**
 * @module
 * An animated sliding "sheet" content container.
 */
import type { t } from './common.ts';

import { Signals } from './m.Signals.ts';
import { Sheet as UI } from './ui.tsx';

/** Sliding sheet renderer and signal helpers. */
export const Sheet: t.SheetLib = {
  UI,
  Signals,
};
