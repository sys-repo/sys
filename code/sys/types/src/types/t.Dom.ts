/**
 * Size and position of a rectangle.
 * https://developer.mozilla.org/en-US/docs/Web/API/DOMRect
 */
export type DomRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

/** Readonly version of the DomRect type. */
export type DomRectReadonly = Readonly<DomRect>;

/**
 * A mouse event initiating from the DOM.
 */
export type DomMouseEventHandler = (e: MouseEvent) => void;
