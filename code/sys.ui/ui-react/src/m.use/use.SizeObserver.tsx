import { useCallback, useEffect, useState } from 'react';
import { type t, Color, css } from './common.ts';

/**
 * Hook Factory: monitor size changes to a DOM element using [ResizeObserver].
 */
export const useSizeObserver: t.UseSizeObserver = <T extends HTMLElement>(
  onChange?: t.SizeObserverChangeHandler,
) => {
  const ref = useCallback((el: T | null) => setElement(el), []);

  const [element, setElement] = useState<T | null>(null);
  const [rect, setRect] = useState<DOMRectReadOnly | undefined>();
  const [count, setCount] = useState(0);

  /**
   * Effect: monitor DOM element size.
   */
  useEffect(() => {
    if (!element) return;
    if (typeof ResizeObserver !== 'function') return;

    const observer = new ResizeObserver((entries) => {
      entries
        .filter((entry) => entry.target === element)
        .forEach((entry) => setRect(entry.contentRect));
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  /**
   * Effect: alert listeners on change.
   */
  useEffect(() => {
    if (rect) onChange?.({ rect, toObject });
  }, [rect]);

  /**
   * Effect: single number to track changes (deps).
   */
  useEffect(() => {
    if (rect) setCount((n) => n + 1);
  }, [rect?.height, rect?.width]);

  /**
   * API
   */
  const toObject = () => wrangle.asObject(rect);
  const api: t.SizeObserverHook<T> = {
    ref,
    get ready() {
      return rect !== undefined;
    },
    get width() {
      return rect?.width ?? 0;
    },
    get height() {
      return rect?.height ?? 0;
    },
    count,
    rect,
    toObject,
    toString() {
      const width = wrangle.sizeString(rect?.width);
      const height = wrangle.sizeString(rect?.height);
      return `${width} x ${height}`;
    },
    toElement(input) {
      const props = wrangle.elementProps(input);
      const { opacity = 0.3, fontSize = 11, Absolute } = props;
      const theme = props.theme ? Color.theme(props.theme) : undefined;
      const color = theme?.fg;
      let display = props.visible === false ? 'none' : props.inline ? 'inline-block' : 'block';
      const base = css({ Absolute, display, fontSize, opacity, color });
      return <div className={css(base, props.style).class}>{`${api.toString()}`}</div>;
    },
  };
  return api;
};

/**
 * Helpers
 */
const wrangle = {
  asObject(rect?: DOMRect): t.DomRect {
    if (!rect) return { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 };
    const { x, y, width, height, top, right, bottom, left } = rect;
    return { x, y, width, height, top, right, bottom, left };
  },

  sizeString(input?: number) {
    if (input === undefined) return '-';
    return input.toFixed(0);
  },

  elementProps(input?: t.SizeObserverElementProps | t.CssEdgesArray): t.SizeObserverElementProps {
    if (!input) return {};
    if (Array.isArray(input)) return { Absolute: input };
    return input;
  },
} as const;
