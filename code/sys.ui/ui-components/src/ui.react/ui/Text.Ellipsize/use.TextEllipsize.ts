import React from 'react';
import { type t, Str, useSizeObserver } from './common.ts';

type P = t.TextEllipsize.Props;

const cache = {
  canvas: undefined as HTMLCanvasElement | undefined,
};

export function useTextEllipsize(props: Pick<P, 'text' | 'tail' | 'ellipsis'>) {
  const size = useSizeObserver<HTMLSpanElement>();
  const textRef = React.useRef<HTMLSpanElement | null>(null);

  const hostRef = size.ref;
  const contentRef = React.useCallback((el: HTMLSpanElement | null) => {
    textRef.current = el;
  }, []);

  const text = React.useMemo(() => {
    const source = props.text ?? '';
    const el = textRef.current;
    if (!source || !el || size.width <= 0) return source;

    const font = wrangle.font(el);
    if (!font) return source;
    if (wrangle.measure(source, font) <= size.width) return source;

    return props.tail === undefined
      ? wrangle.fitEnd(source, size.width, font, props.ellipsis)
      : wrangle.fitTail(source, size.width, font, props.tail, props.ellipsis);
  }, [props.text, props.tail, props.ellipsis, size.rev, size.width]);

  const isEllipsized = text !== (props.text ?? '');

  return { hostRef, contentRef, text, isEllipsized, size } as const;
}

/**
 * Helpers:
 */
const wrangle = {
  fitEnd(text: string, width: number, font: string, ellipsis?: string) {
    let lo = 1;
    let hi = text.length;
    let best = Str.truncate(text, 1, ellipsis ? { ellipsis } : undefined);

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const next = Str.truncate(text, mid, ellipsis ? { ellipsis } : undefined);
      if (wrangle.measure(next, font) <= width) {
        best = next;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    return best;
  },

  fitTail(text: string, width: number, font: string, tail?: number, ellipsis?: string) {
    const right = wrangle.clamp(tail, 7);
    let lo = 0;
    let hi = text.length;
    let best = Str.ellipsize(text, [0, right], ellipsis ? { ellipsis } : undefined);

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const next = Str.ellipsize(text, [mid, right], ellipsis ? { ellipsis } : undefined);
      if (wrangle.measure(next, font) <= width) {
        best = next;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    return best;
  },

  clamp(input: number | undefined, fallback: number) {
    if (!Number.isFinite(input as number)) return fallback;
    return Math.max(0, Math.floor(input as number));
  },

  font(el: HTMLElement) {
    if (typeof window === 'undefined') return '';
    return window.getComputedStyle(el).font;
  },

  measure(text: string, font: string) {
    const ctx = wrangle.context();
    if (!ctx) return text.length * 8;
    ctx.font = font;
    return ctx.measureText(text).width;
  },

  context() {
    if (typeof document === 'undefined') return null;
    const canvas = (cache.canvas ??= document.createElement('canvas'));
    return canvas.getContext('2d');
  },
} as const;
