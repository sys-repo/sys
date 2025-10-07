import { type t } from './common.ts';

/** Any event with a string literal `kind`. */
export type EventWithKind<T = string> = { readonly kind: T };

/** Flags representing async-schedule to fire events through an event-bus on. */
export type EmitEventSchedule = 'sync' | t.AsyncSchedule;

/**
 * Emit to through the given bus an event on a particular schedule.
 * - default: "micro" (safe against re-entrancy)
 * - "sync":   inline, immediate (use sparingly)
 * - "macro":  next timer tick
 * - "raf":    next animation frame (or ~16ms fallback)
 */
export type EmitEvent<E extends EventWithKind = EventWithKind> = (
  bus$: t.Subject<E>,
  schedule: t.EmitEventSchedule,
  evt: E,
) => void;

/**
 * Factory for a union-specialized emitter.
 * Returns an `emit` function restricted to the given event type.
 */
export type EmitForFactory = <E extends EventWithKind>() => EmitEvent<E>;
