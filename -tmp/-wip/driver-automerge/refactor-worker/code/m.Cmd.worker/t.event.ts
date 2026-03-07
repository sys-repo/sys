/**
 * Re-export event types from m.worker for the hybrid approach.
 * High-frequency events stay as direct postMessage for performance.
 */
export type * from '../m.worker/t.wire.ts';
