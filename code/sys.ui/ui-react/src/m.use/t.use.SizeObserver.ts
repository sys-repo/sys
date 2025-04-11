import type { RefCallback } from 'react';
import type { t } from './common.ts';

/**
 * Hook Factory: monitor size changes to a DOM element using [ResizeObserver].
 */
export type UseSizeObserver = <T extends HTMLElement>(
  onChange?: t.SizeObserverChangeHandler,
) => t.SizeObserverHook<T>;

/**
 * Hook: monitor size changes to a DOM element using [ResizeObserver].
 */
export type SizeObserverHook<T extends HTMLElement> = {
  /** Callback ref to be assigned to the element to observe. */
  ref: RefCallback<T>;

  /** The latest dimensions of the element (or null if not measured yet). */
  rect?: DOMRectReadOnly;

  /** The `rect.width` value. */
  readonly width?: t.Pixels | undefined;

  /** The `rect.height` value. */
  readonly height: t.Pixels | undefined;

  /** Convert to a simple object. */
  toObject(): t.DomRect;
};

/**
 * Fires when the size of an observed DOM element changes.
 */
export type SizeObserverChangeHandler = (e: SizeObserverChangeHandlerArgs) => void;
export type SizeObserverChangeHandlerArgs = {
  readonly rect: DOMRectReadOnly;
  toObject(): t.DomRect;
};
