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
  readonly ref: RefCallback<T>;

  /** Flag indicating if the first render-pass has allowed a measurement. */
  readonly ready: boolean;

  /** The latest dimensions of the element (or null if not measured yet). */
  readonly rect?: DOMRectReadOnly;

  /** The `rect.width` value. */
  readonly width?: t.Pixels | undefined;

  /** The `rect.height` value. */
  readonly height: t.Pixels | undefined;

  /** Convert to a simple object. */
  toObject(): t.DomRect;

  /** Create a string representation of the size. */
  toString(): string;

  /** Renders a react element "<width> x <height>". */
  toElement(props?: SizeObserverElementProps | t.CssEdgesArray): t.ReactNode;
};

/**
 * Fires when the size of an observed DOM element changes.
 */
export type SizeObserverChangeHandler = (e: SizeObserverChangeHandlerArgs) => void;
export type SizeObserverChangeHandlerArgs = {
  readonly rect: DOMRectReadOnly;
  toObject(): t.DomRect;
};

/**
 * Properties for the size rendered as an element ("<width> x <height>").
 */
export type SizeObserverElementProps = {
  /** Display: "block" (false, default) or inline-block (true). */
  inline?: boolean;
  visible?: boolean;
  fontSize?: number;
  opacity?: number;
  style?: t.CssInput;
  Absolute?: t.CssEdgesInput;
};
