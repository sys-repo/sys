import type { t } from './common.ts';

import { cloner, clonerRef } from './Immutable.cloner.ts';
import { viaObservable, viaOverride } from './Immutable.events.ts';
import { Map } from './Immutable.map.ts';
import { Is, toObject } from './u.ts';

const map = Map.create;

/**
 * Helpers for working with raw Immutable<T> objects.
 */
export const Immutable: t.ImmutableLib = {
  Is,
  cloner,
  clonerRef,

  Map,
  map,

  toObject,
  events: { viaOverride, viaObservable },
} as const;
