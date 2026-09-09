import { asReadonly, Is, Lens, type t, toObject } from './common.ts';
import { Events } from './m.Events.ts';
import { cloner, clonerRef } from './m.Immutable.cloner.ts';
import { Patch } from './m.Patch.ts';

/**
 * Helpers for working with raw Immutable<T> objects.
 */
export const Immutable: t.ImmutableRfc6902.Lib = Object.freeze(
  {
    Is,
    Events,
    Patch,
    Lens,
    cloner,
    clonerRef,
    asReadonly,
    toObject,
  } as const,
);
