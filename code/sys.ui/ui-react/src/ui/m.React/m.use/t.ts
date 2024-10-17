import type { t } from '../common.ts';

type M = React.MouseEventHandler;

/**
 * Properties passed to the `useMouse` hook.
 */
export type UseMouseProps = {
  onDown?: M;
  onUp?: M;
  onEnter?: M;
  onLeave?: M;
  onDrag?: UseMouseDragHandler;
};

/**
 * Hook: information about the movement of a mouse cursor.
 */
export type UseMouseMovement = {
  readonly x: number;
  readonly y: number;
  readonly movement: t.Point;
  readonly client: t.Point;
  readonly page: t.Point;
  readonly offset: t.Point;
  readonly screen: t.Point;
  readonly button: number;
  readonly modifiers: t.KeyboardModifierFlags;
};

/**
 * Events
 */

/**
 * Event handler for a mouse-drag operation.
 */
export type UseMouseDragHandler = (e: UseMouseDragHandlerArgs) => void;

/**
 * Agrument supplied to the mouse-drag handler.
 */
export type UseMouseDragHandlerArgs = UseMouseMovement & { cancel(): void };
