/**
 * @module
 * An animated sliding "sheet" content container.
 */
import { Signals } from './m.Signals.ts';
import { type t } from './t.ts';
import { Sheet as UI } from './ui.tsx';

export const Sheet: t.SheetLib = {
  UI,
  Signals,
};
