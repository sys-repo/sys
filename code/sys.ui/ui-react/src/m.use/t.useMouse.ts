import type { MouseEventHandler } from 'react';
import type { t } from './common.ts';

type M = MouseEventHandler;

/**
 * Properties passed to the `useMouse` hook.
 */
export type UseMouseProps = {
  onDown?: M;
  onUp?: M;
  onEnter?: M;
  onLeave?: M;
  onDrag?: t.UseMouseDragHandler;
};

/**
 * Hook Factory: keep track of mouse events for an HTML element
 */
export type UseMouseHook = (props?: t.UseMouseProps) => t.UseMouse;

/**
 * Hook: keep track of mouse events for an HTML element.
 * Usage:
 *
 *     const mouse = useMouse();
 *     <div {...mouse.handlers} />
 */
export type UseMouse = {
  readonly is: { readonly over: boolean; readonly down: boolean; readonly dragging: boolean };
  readonly handlers: { onMouseDown: M; onMouseUp: M; onMouseEnter: M; onMouseLeave: M };
  readonly drag?: t.MouseMovement;
  reset(): void;
};
