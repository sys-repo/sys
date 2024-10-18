import { useEffect, useState } from 'react';
import { DevBus } from '../u.Bus/mod.ts';
import { rx, type t } from './common.ts';

type Id = string;

/**
 * Monitors the "redraw" event and causes a re-render when matched.
 */
export function useRedrawEvent(
  instance: t.DevInstance,
  renderers: (Id | t.DevRendererRef | t.DevRenderRef | undefined)[],
) {
  const ids = renderers
    .filter(Boolean)
    .map((item) => (typeof item === 'object' ? item.id : item) as Id);

  const [count, setCount] = useState(0);
  const redraw = () => setCount((prev: number) => prev + 1);

  /**
   * [Lifecycle]
   */
  useEffect(() => {
    const events = DevBus.Events({ instance });
    const hasRenderer = (renderers: Id[]) => ids.some((id) => renderers.includes(id));
    const matchTarget = (value?: t.DevRedrawTarget) => value === 'all';
    const match = (e: t.DevRedraw) => matchTarget(e.target) || hasRenderer(e.renderers);
    const match$ = events.redraw.$.pipe(rx.filter(match));
    match$.subscribe(redraw);
    return events.dispose;
  }, [ids.join(',')]);

  /**
   * API
   */
  return { count, ids } as const;
}
