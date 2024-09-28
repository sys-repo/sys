import { Dispose } from '../u.Dispose/mod.ts';

/**
 * Generates a generic disposable interface that is
 * typically mixed into a wider interface of some kind.
 */
export const disposable = Dispose.disposable;

/**
 * Generates a disposable interface that maintains
 * and exposes it's disposed state.
 */
export const lifecycle = Dispose.lifecycle;

/**
 * "Completes" a subject by running:
 *
 *  1. subject.next();
 *  2. subject.complete();
 */
export const done = Dispose.done;
