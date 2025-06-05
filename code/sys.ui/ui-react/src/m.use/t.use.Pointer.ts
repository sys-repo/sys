import type { t } from './common.ts';

type M = React.MouseEventHandler;
type T = React.TouchEventHandler;

/**
 * Hook Factory: keep track of mouse events for an HTML element
 */
export type UseMouse = (props?: t.MouseHookProps) => t.MouseHook;

/**
 * Hook: keep track of mouse events for an HTML element.
 * Usage:
 *
 *     const mouse = useMouse();
 *     <div {...mouse.handlers} />
 */
export type MouseHook = {
  readonly is: {
    readonly over: boolean;
    readonly down: boolean;
    readonly dragging: boolean;
  };
  readonly handlers: {
    readonly onMouseDown: M;
    readonly onMouseUp: M;
    readonly onMouseEnter: M;
    readonly onMouseLeave: M;
  };
  readonly drag?: t.MouseMovement;
  reset(): void;
};

/**
 * Properties passed to the `useMouse` hook.
 */
export type MouseHookProps = {
  onDown?: M;
  onUp?: M;
  onEnter?: M;
  onLeave?: M;
  onDrag?: t.UseMouseDragHandler;
};
