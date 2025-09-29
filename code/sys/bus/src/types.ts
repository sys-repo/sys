/**
 * @module
 * @types module
 */
import type { t } from './common.ts';

/** Flags representing async-schedule to fire events through the bus on. */
export type BusEmitSchedule = 'sync' | t.AsyncSchedule;
