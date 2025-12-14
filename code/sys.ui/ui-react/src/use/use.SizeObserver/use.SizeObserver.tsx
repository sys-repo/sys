import { useCallback, useEffect, useRef, useState } from 'react';
import { type t, Color, css } from '../common.ts';

type Handler = t.SizeObserverChangeHandler;

/**
 * Hook: monitor size changes to a DOM element using [ResizeObserver].
 */
export const useSizeObserver: t.UseSizeObserver = <T extends HTMLElement>(onChange?: Handler) => {
  /**
   * Refs:
   */
  const elementRef = useRef<T | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const lastRef = useRef<{ readonly w: number; readonly h: number } | null>(null);

  /**
   * State:
   */
  const [count, setCount] = useState(0);
  const [rect, setRect] = useState<DOMRectReadOnly | undefined>();
  const toObject = () => wrangle.asObject(rect);

  const ref = useCallback((el: T | null) => {
    if (elementRef.current === el) return;
    elementRef.current = el;

    // Tear down any prior observer immediately.
    observerRef.current?.disconnect();
    observerRef.current = null;
    lastRef.current = null;

    if (!el) return;
    if (typeof ResizeObserver !== 'function') return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target !== el) continue;

        // Avoid re-setting same values (cuts feedback + noise).
        const next = entry.contentRect;
        const w = next.width;
        const h = next.height;
        const prev = lastRef.current;
        if (prev && prev.w === w && prev.h === h) return;
        lastRef.current = { w, h };

        setRect(next);
        return;
      }
    });

    observer.observe(el);
    observerRef.current = observer;
  }, []);

  /**
   * Effect: Cleanup
   */
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      elementRef.current = null;
      lastRef.current = null;
    };
  }, []);

  /**
   * Effect: alert listeners on change.
   */
  useEffect(() => {
    if (rect) onChange?.({ rect, toObject });
  }, [rect, onChange]);

  /**
   * Effect: single number to track changes (deps).
   */
  useEffect(() => {
    if (rect) setCount((n) => n + 1);
  }, [rect?.height, rect?.width]);

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
      const display = props.visible === false ? 'none' : props.inline ? 'inline-block' : 'block';
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
  asObject(rect?: DOMRectReadOnly): t.DomRect {
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
