/**
 * @module
 * Bounded cancellation-container capture for Deno and Node.
 */
import type { t } from './common.ts';
import { until } from './u.until.ts';

/** Captures containers only; lifecycle leaves remain live and caller-owned. */
export const Snapshot: t.Dispose.Snapshot.Lib = Object.freeze({ until });
