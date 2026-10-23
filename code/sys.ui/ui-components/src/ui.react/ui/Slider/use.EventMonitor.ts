import { useRef } from 'react';
import { type t, D, usePointer } from './common.ts';
import { Wrangle } from './u.ts';

type Args = {
  enabled?: boolean;
  onChange?: t.SliderChangeHandler;
};

/**
 * HOOK: hook-up and manage mouse events.
 */
export function useEventMonitor(args: Args = {}) {
  const { enabled = D.enabled, onChange } = args;

  const fireChange = (x: t.Pixels, complete = false) => {
    if (!onChange || !enabled || !ref.current) return;
    const percent = Wrangle.elementToPercent(ref.current, x);
    onChange?.({ percent, complete });
  };

  const ref = useRef<HTMLDivElement>(null);
  const mouse = usePointer({
    onDown: (e) => fireChange(e.client.x, false),
    onUp: (e) => fireChange(e.client.x, true),
    onDrag: (e) => fireChange(e.client.x),
  });

  /**
   * API:
   */
  const dragging = mouse.is.dragdropping;
  const pressed = mouse.is.down || dragging;
  return {
    ref,
    el: ref.current,
    enabled,
    pressed,
    dragging,
    handlers: mouse.handlers,
  } as const;
}
