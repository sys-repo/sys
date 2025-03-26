import type { RefCallback } from 'react';
import type { t } from '../common.ts';

/**
 * Hook Factory: monitor size changes to a DOM element using [ResizeObserver].
 */
export type UseSizeObserver = <T extends HTMLElement>() => t.SizeObserver<T>;

/**
 * Hook: monitor size changes to a DOM element using [ResizeObserver].
 */
export type SizeObserver<T extends HTMLElement> = {
  /** Callback ref to be assigned to the element to observe. */
  ref: RefCallback<T>;

  /** The latest dimensions of the element (or null if not measured yet). */
  rect?: DOMRectReadOnly;
};
