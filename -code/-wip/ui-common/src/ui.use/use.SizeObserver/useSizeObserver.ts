import { useEffect, useRef, useState } from 'react';
import { Wrangle } from './Wrangle.ts';
import { DEFAULTS, rx, type t } from './common.ts';

type E = HTMLElement;

/**
 * Monitor size of an HTML/DOM element.
 *
 * Ref:
 *    Standards API
 *    https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
 *
 */
export function useSizeObserver<T extends E = HTMLDivElement>(args?: t.UseSizeObserverArgs<T>) {
  const ref = args?.ref ?? useRef<T>(null);
  const ready = typeof ref.current === 'object';

  const [batch, setBatch] = useState(0);
  const [resizing, setResizing] = useState(false);
  const [rect, setRect] = useState<t.DomRect>(DEFAULTS.emptyRect);

  /**
   * Lifecycle
   */
  useEffect(() => {
    let dom$: ResizeObserver;
    const { dispose, dispose$ } = rx.disposable();
    const batchSubject$ = new rx.Subject<void>();
    const batch$ = batchSubject$.pipe(rx.takeUntil(dispose$));

    // Debounce resize events into batches that can
    // signal to containing components.
    batch$.subscribe(() => setResizing(true));
    batch$.pipe(rx.debounceTime(150)).subscribe(() => {
      setResizing(false);
      setBatch((prev: number) => prev + 1);
    });

    const update = (rect: t.DomRect) => {
      setRect(rect);
      args?.onChange?.({
        ready,
        rect: Wrangle.rect(rect),
        size: Wrangle.size(rect),
      });
      batchSubject$.next();
    };

    if (ref.current) {
      dom$ = new ResizeObserver((entries) => entries.forEach((entry) => update(entry.contentRect)));
      dom$.observe(ref.current);
    }

    /**
     * Dispose
     */
    return () => {
      dispose();
      dom$?.disconnect();
    };
  }, [ready]);

  /**
   * API
   */
  const api = {
    ref,
    ready,
    resizing,
    batch,
    get rect() {
      return Wrangle.rect(rect);
    },
    get size() {
      return Wrangle.rect(rect);
    },
  } as const;
  return api;
}
