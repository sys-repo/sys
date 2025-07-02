import type { ImmutableLib } from './t.ts';

import { cloner, clonerRef } from './Immutable.cloner.ts';
import { viaObservable, viaOverride } from './Immutable.events.ts';
import { Is, toObject } from './u.ts';

/**
 * Helpers for working with raw Immutable<T> objects.
 */
export const Immutable: ImmutableLib = {
  Is,
  cloner,
  clonerRef,

  toObject,
  events: { viaOverride, viaObservable },
} as const;
