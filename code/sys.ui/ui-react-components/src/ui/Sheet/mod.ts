/**
 * An animated sliding "sheet" content container.
 * @module
 */
import type { SheetLib } from './t.ts';

import { Signals } from './m.Signals.ts';
import { Sheet as UI } from './ui.tsx';

export const Sheet: SheetLib = {
  UI,
  Signals,
};
