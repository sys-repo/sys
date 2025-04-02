import { type t } from './common.ts';
import { createStack } from './m.Signals.Stack.ts';

/**
 * Library: Sheet Signals (State).
 */
export const Signals: t.SheetSignalsLib = {
  stack: createStack,
};
