/**
 * @module
 * An animated sliding "sheet" content container.
 */
import type { t } from './common.ts';
import { Sheet as View } from './ui.tsx';
import { Signals } from './m.Signals.ts';

export const Sheet: t.SheetLib = {
  View,
  Signals,
};
