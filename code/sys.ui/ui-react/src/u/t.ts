import type { MouseEvent } from 'react';
import type { t } from './common.ts';

/**
 * Helpers for working with React generated events.
 */
export type ReactEventLib = {
  /** Convert react mouse events into keyboard modifier info object. */
  modifiers(e: MouseEvent): t.KeyboardModifierFlags;
};

/**
 * Helpers for working with strings in react.
 */
export type ReactStringLib = {
  /**
   * Breaks a string with newline ("\n") characters into a fragment
   * of <span>'s and <br> elements.
   */
  break(text: string | t.ReactNode): t.ReactNode;
};
