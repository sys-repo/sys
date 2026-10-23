import { createStack } from './m.Signals.Stack.ts';
import type { SheetSignalsLib } from './t.ts';

/**
 * Library: Sheet Signals (State).
 */
export const Signals: SheetSignalsLib = {
  stack: createStack,
};
