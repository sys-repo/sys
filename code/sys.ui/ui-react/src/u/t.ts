import type { MouseEvent as ReactMouseEvent } from 'react';
import type { t } from './common.ts';

/**
 * Helpers for working with React generated events.
 */
export declare namespace ReactEvent {
  /** React generated-event helper surface. */
  export type Lib = {
    /** Convert react mouse events into keyboard modifier info object. */
    modifiers(
      e: ReactMouseEvent | KeyboardEvent | PointerEvent | Event,
    ): t.Keyboard.Modifier.Flags;
  };
}

/**
 * Helpers for working with strings in react.
 */
export declare namespace ReactString {
  /** React string helper surface. */
  export type Lib = {
    /** Break a newline-delimited string into `<span>` and `<br>` elements. */
    break(text: string | t.ReactNode): t.ReactNode;
  };
}

/**
 * Helpers for working with react children.
 */
export declare namespace ReactChildren {
  /** React children helper surface. */
  export type Lib = {
    /** Generate a key string representing the set and order of component types in `children`. */
    deps(children?: t.ReactNode): DepsKey;

    /** Generate a memoized key string representing the set and order of component types. */
    useDeps(children?: t.ReactNode): DepsKey;
  };

  /** A pipe-separated (`|`) dependency key built from `ReactChildren.deps()`. */
  export type DepsKey = string;
}
