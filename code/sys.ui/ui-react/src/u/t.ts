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

/**
 * Helpers for working with react children.
 */
export type ReactChildrenLib = {
  /**
   * Generate a “key” string representing the
   * set and order of component types in `children`.
   */
  deps(children?: t.ReactNode): ReactChildrenDepsKey;

  /**
   * Generate a memoized “key” string representing the
   * set and order of component types in `children`.
   */
  useDeps(children?: t.ReactNode): ReactChildrenDepsKey;
};

export type ReactChildrenDepsKey = string;
