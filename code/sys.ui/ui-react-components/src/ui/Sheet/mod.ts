/**
 * @module
 * An animated sliding "sheet" content container.
 */
import type { SheetLib } from './t.ts';

import { Signals } from './m.Signals.ts';
import { Sheet as View } from './ui.tsx';

export const Sheet: SheetLib = {
  View,
  Signals,
};
