import type { ImmutableLib } from './t.ts';

import { Lens } from '../m.Immutable.Lens/mod.ts';
import { Events } from './m.Events.ts';
import { cloner, clonerRef } from './m.Immutable.cloner.ts';
import { Patch } from './m.Patch.ts';
import { Is, toObject } from './u.ts';

/**
 * Helpers for working with raw Immutable<T> objects.
 */
export const Immutable: ImmutableLib = {
  Is,
  Events,
  Patch,
  Lens,
  cloner,
  clonerRef,
  toObject,
} as const;
