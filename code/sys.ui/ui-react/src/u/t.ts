import type { t } from './common.ts';

/**
 * Helpers for working with React generated events.
 */
export type ReactEventLib = {
  /** Convert react mouse events into keyboard modifier info object. */
  modifiers(e: React.MouseEvent): t.KeyboardModifierFlags;
};
