import { type t, emitFor } from './common.ts';

/**
 * Emit an event to the bus on a chosen async-schedule.
 */
export const emit = emitFor<t.EditorEvent>();
