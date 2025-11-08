import { type t, Is, Lens, toObject } from './common.ts';
import { Events } from './m.Events.ts';
import { cloner, clonerRef } from './m.Immutable.cloner.ts';
import { Patch } from './m.Patch.ts';

/**
 * Helpers for working with raw Immutable<T> objects.
 */
export const Immutable: t.ImmutableLib = {
  Is,
  Events,
  Patch,
  Lens,
  cloner,
  clonerRef,
  toObject,
} as const;
