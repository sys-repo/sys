import type { MouseEvent } from 'react';
import type { t } from './common.ts';

/**
 * Helpers for working with React generated events.
 */
export type ReactEventLib = {
  /** Convert react mouse events into keyboard modifier info object. */
  modifiers(
    e: React.MouseEvent | MouseEvent | KeyboardEvent | PointerEvent | Event,
  ): t.KeyboardModifierFlags;
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
   *
   * Usage:
   *
   *    const deps = ReactChildren.useDeps(props.children);
   *    React.useEffect(() => {
   *      // ...
   *    }, [deps]);
   *
   */
  useDeps(children?: t.ReactNode): ReactChildrenDepsKey;
};

/**
 * A pipe-seperated ("|") dependency key built from `ReactChildren.deps()`.
 */
export type ReactChildrenDepsKey = string;
